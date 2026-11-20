# BlockDuino

Editor visual para generar código Arduino C++ con Blockly.

## Sincronización bidireccional

- Los bloques actualizan el código C++ en tiempo real.
- El editor C++ permite escribir y editar manualmente.
- Al dejar de escribir, BlockDuino intenta reconstruir los bloques.
- La conversión inversa admite un subconjunto de C++ Arduino: `setup()`, `loop()`, variables globales simples, expresiones aritméticas/lógicas, condiciones, bucles y comandos comunes de pines, Servo, Serial, I2C/SPI y LCD.
- No es un parser ni compilador completo de C++. El código no reconocido no reemplaza el último diagrama válido.

