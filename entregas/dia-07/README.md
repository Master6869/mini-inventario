# Día 07 — Skill y subagente

La rama parte del PR borrador del Día 4, donde están Supabase y las pruebas disponibles. El repositorio no tenía ramas para los días 5 y 6.

## Pedido que se compara

«Escribe una prueba de Playwright para editar un producto».

### Borrador anterior a la skill

```js
test('editar un producto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Editar' }).first().click();
  await page.getByLabel('Cantidad', { exact: true }).fill('6');
  await page.getByRole('button', { name: 'Guardar producto' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Tornillos' }))
    .toContainText('6');
});
```

### Revisión del borrador

El primer borrador supone una sesión abierta y un producto existente. Selecciona la primera fila editable, aunque luego verifica una fila distinta. La skill pide credenciales desde el entorno, crear un producto único, usar su fila, comprobar que persiste al recargar y cubrir una edición inválida. La rama del Día 4 todavía carece de SKU y requiere identificar cada producto de prueba por nombre único.

El borrador inicial está conservado aquí para comparar. Queda pendiente ejecutar el mismo pedido en dos conversaciones limpias y verificar la prueba con una cuenta de pruebas autorizada.
