# Registro de Arquitectura y Decisiones Técnicas

Este archivo registra hallazgos críticos detectados por el Arquitecto Senior.

| Fecha | Hallazgo / Issue | Solución / Mejora | Severidad |
|-------|------------------|-------------------|-----------|
| 2026-04-10 | El archivo test_old.js utiliza el puerto 8080 y el módulo http de Node.js. El código no utiliza innerHTML, lo que evita el riesgo de XSS. Sin embargo, es importante mencionar que el uso de require en lugar de import es un posible problema de seguridad, ya que puede llevar a la exposición de la función require y permitir la ejecución de código no deseado. | Se debería considerar migrar el archivo test_old.js a ESM (ES Modules) para utilizar import en lugar de require. | ALTA |
