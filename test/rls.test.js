const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

test('migración: CRUD propio y aislamiento RLS entre dos usuarios en PostgreSQL local', async () => {
  const db = new PGlite();
  const usuarioA = '11111111-1111-4111-8111-111111111111';
  const usuarioB = '22222222-2222-4222-8222-222222222222';
  try {
    // Simula únicamente los roles y auth.uid() que Supabase proporciona.
    // El SQL real de la migración se ejecuta sin modificaciones.
    await db.exec(`
      create role authenticated nologin;
      create role anon nologin;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated, anon;
      insert into auth.users values ('${usuarioA}'), ('${usuarioB}');
    `);
    const archivo = fs.readdirSync(path.join(__dirname, '../supabase/migrations'))
      .find(nombre => nombre.endsWith('_crear_productos.sql'));
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations', archivo), 'utf8'));
    const politicas = await db.query("select cmd from pg_policies where schemaname = 'public' and tablename = 'productos' order by cmd");
    assert.deepEqual(politicas.rows.map(fila => fila.cmd), ['DELETE', 'INSERT', 'SELECT', 'UPDATE']);

    await db.exec('set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [usuarioA]);
    const insercionA = await db.query("insert into public.productos(nombre,cantidad,minimo) values ('Producto A',5,2) returning id,user_id");
    const productoA = insercionA.rows[0].id;
    assert.equal(insercionA.rows[0].user_id, usuarioA);
    assert.equal((await db.query('select * from public.productos')).rows.length, 1);
    assert.equal((await db.query('update public.productos set cantidad = 7 where id = $1 returning cantidad', [productoA])).rows[0].cantidad, 7);

    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [usuarioB]);
    assert.equal((await db.query('select * from public.productos')).rows.length, 0);
    const productoB = (await db.query("insert into public.productos(nombre,cantidad,minimo) values ('Producto B',8,3) returning id")).rows[0].id;
    assert.equal((await db.query('select * from public.productos where id = $1', [productoA])).rows.length, 0);
    assert.equal((await db.query('update public.productos set cantidad = 99 where id = $1 returning id', [productoA])).rows.length, 0);
    assert.equal((await db.query('delete from public.productos where id = $1 returning id', [productoA])).rows.length, 0);
    await assert.rejects(db.query('insert into public.productos(user_id,nombre) values ($1,$2)', [usuarioA, 'Falso']), /row-level security/i);
    await assert.rejects(db.query('update public.productos set user_id = $1 where id = $2', [usuarioA, productoB]), /row-level security/i);
    await assert.rejects(db.query("insert into public.productos(nombre,cantidad) values ('Negativo',-1)"), /check constraint/i);
    await assert.rejects(db.query("insert into public.productos(nombre) values ('   ')"), /check constraint/i);
    assert.equal((await db.query('delete from public.productos where id = $1 returning id', [productoB])).rows.length, 1);

    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [usuarioA]);
    assert.equal((await db.query('select cantidad from public.productos')).rows[0].cantidad, 7);
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    assert.equal((await db.query('select * from public.productos')).rows.length, 0);
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from public.productos'), /permission denied/i);
    await db.exec('reset role');
    await db.query('delete from auth.users where id = $1', [usuarioA]);
    assert.equal((await db.query('select * from public.productos')).rows.length, 0);
  } finally {
    await db.close();
  }
});
