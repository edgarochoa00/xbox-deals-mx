# Xbox Deals MX

Catálogo de ofertas mexicanas para regalar, con un 26% adicional ofrecido por el propietario del sitio. El enlace a Xbox muestra el precio de Xbox; el descuento adicional se identifica por separado.

## Uso

- `npm ci --ignore-scripts`
- `npm run dev`
- `npm test`
- `npm run scrape`: verifica y reemplaza el catálogo completo.
- `npm run build`

## Reglas de publicación

El actualizador descubre productos en el canal oficial `DynamicChannel.GameDeals`, recorriendo todas sus páginas. También consulta las suscripciones relacionadas que devuelve Xbox. Verifica cada producto con Microsoft Display Catalog para `market=MX` y `languages=es-mx`.

Solo publica juegos completos y suscripciones de consola. En los paquetes comprueba recursivamente que se incluya al menos un juego base: Microsoft también clasifica algunos paquetes de complementos como `Game`. Los juegos necesitan metadatos nativos de Xbox One/Series; la retrocompatibilidad de Xbox 360 no basta. Se excluyen complementos, monedas, pruebas y preventas.

Cada SKU necesita una disponibilidad `Gift` para México y consola, sin requisito de membresía, con fechas activas, moneda MXN, precio mayor que cero y hasta $500, y precio habitual estrictamente mayor que el precio de regalo. No se combinan precios de distintas ediciones ni se usa un descuento de compra personal para regalar. Si faltan datos, se excluye el producto. Las suscripciones solo aparecen cuando cumplen estas mismas reglas; su duración se conserva.

Los campos de estas interfaces públicas de Microsoft pueden cambiar: no son una API contractual de este proyecto. Las respuestas mal formadas, errores de red y paginación rota hacen fallar el trabajo. No se renueva la fecha del catálogo anterior. La escritura del nuevo JSON es atómica y una verificación completa sin resultados guarda una lista vacía.

## Vigencia y precios

`public/data/games.json` usa `schemaVersion: 2`, fechas de comprobación/caducidad y una lista `games`. Cada oferta incluye el producto, SKU, disponibilidad de regalo y ventana de vigencia que la respaldan. La web aplica la misma política que el bot, oculta precios vencidos y descarta verificaciones de más de 30 horas, incluso si la pestaña permanece abierta. Los favoritos usan producto y SKU, no la posición de la oferta en la lista. Los antiguos favoritos numéricos no se migran porque no identifican un producto de forma confiable.

El límite de $500 corresponde al precio de regalo de Xbox, antes del 26% adicional. El ahorro total se calcula contra el precio habitual; el porcentaje de oferta de Xbox se muestra por separado.

## Automatización

`.github/workflows/update-deals.yml` ejecuta la misma orden de actualización cada seis horas, prueba las reglas y compila el sitio antes de subir datos a `main`. GitHub puede retrasar las ejecuciones programadas. No necesita navegador ni credenciales de Xbox. Las verificaciones de pull requests están en `check.yml`.

Los antiguos puntos de entrada `scrape_verified_deals.cjs` y `sync_real_xbox_deals.cjs` delegan en el actualizador nuevo. Los demás scripts históricos no participan en el flujo de producción; sus catálogos sin evidencia no pasan la validación de la web.

## Validación

Las pruebas cubren moneda y mercado, ausencia de descuento, límites de precio, regalo frente a compra, ventanas de vigencia, generaciones de consola, suscripciones, complementos, SKU y fallos de red/paginación. Para revisar la interfaz, ejecutar el sitio local y comprobar búsqueda, favoritos tras recargar, vista de lista, navegación por teclado, modal y diseño móvil.
