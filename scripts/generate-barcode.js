/**
 * Script para generar códigos de barras EAN-13 válidos aleatorios
 * Uso: Copia y pega este código en la consola de desarrollador de Electron
 */

// Función para calcular dígito de control EAN-13
function calculateEAN13CheckDigit(barcode) {
  const digits = barcode.replace(/\D/g, '');
  if (digits.length !== 12) return null;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;
  return checksum.toString();
}

// Función para validar código EAN-13
function validateEAN13(barcode) {
  const digits = barcode.replace(/\D/g, '');
  if (digits.length !== 13) return false;

  const first12 = digits.substring(0, 12);
  const checkDigit = digits.substring(12, 13);
  const calculatedCheckDigit = calculateEAN13CheckDigit(first12);

  return checkDigit === calculatedCheckDigit;
}

// Función para generar un código EAN-13 aleatorio válido
function generateEAN13(prefix = '7') {
  // EAN-13: 13 dígitos, primeros 2-3 suelen ser prefijos de país
  const prefixes = ['7', '750', '751', '752', '753', '754', '755', '756', '757', '758', '759'];

  // Seleccionar prefijo aleatorio
  const selectedPrefix = Array.isArray(prefix)
    ? prefix[Math.floor(Math.random() * prefix.length)]
    : prefixes[Math.floor(Math.random() * prefixes.length)];

  // Generar los dígitos restantes (12 dígitos sin contar el prefijo)
  let randomDigits = selectedPrefix;

  // Si el prefijo no tiene longitud suficiente para llegar a 12 dígitos
  while (randomDigits.length < 12) {
    randomDigits += Math.floor(Math.random() * 10).toString();
  }

  // Tomar solo los primeros 12 dígitos
  const first12 = randomDigits.substring(0, 12);

  // Calcular dígito de control
  const checkDigit = calculateEAN13CheckDigit(first12);

  // Completar código de barras
  return first12 + checkDigit;
}

// Función para generar múltiples códigos de barras
function generateMultipleEAN13(count = 1, prefix = null) {
  const codes = [];
  const usedCodes = new Set();

  for (let i = 0; i < count; i++) {
    let code;
    let attempts = 0;

    // Evitar códigos duplicados
    do {
      code = generateEAN13(prefix);
      attempts++;

      // Evitar bucle infinito
      if (attempts > 100) {
        console.warn(`⚠️ No se pudo generar código único después de ${attempts} intentos`);
        break;
      }
    } while (usedCodes.has(code));

    if (code && !usedCodes.has(code)) {
      usedCodes.add(code);
      codes.push(code);
    }
  }

  return codes;
}

// Función para verificar si un código ya existe (simulado)
function checkBarcodeExists(barcode) {
  // Simulación - en una app real esto sería una llamada a la API
  const existingCodes = [
    '7009937536944', // Código que ya sabemos que existe
    '764375381473',  // Otro código de prueba
  ];
  return existingCodes.includes(barcode);
}

// Función principal generadora con múltiples opciones
function generateBarcode(options = {}) {
  const {
    count = 1,
    prefix = '7',
    country = 'Colombia',
    description = 'generación',
    checkExisting = false,
    showValidation = true
  } = options;

  console.log(`\n🏷️  Generador de Códigos de Barras EAN-13`);
  console.log(`📍  País: ${country}`);
  console.log(`📋  Propósito: ${description}`);
  console.log(`🔢  Cantidad: ${count}`);
  console.log(`🏷️  Prefijo: ${prefix}`);
  console.log(`\n⏳  Generando códigos...\n`);

  const startTime = performance.now();

  if (checkExisting) {
    console.log('🔍 Verificando códigos existentes...');
  }

  const codes = generateMultipleEAN13(count, prefix);

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(3);

  console.log('✅ Códigos generados exitosamente:\n');

  codes.forEach((code, index) => {
    const isValid = validateEAN13(code);
    const exists = checkExisting ? checkBarcodeExists(code) : false;

    console.log(`${index + 1}. ${code}`);

    if (showValidation) {
      console.log(`   ✅ Validación: ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
      if (checkExisting) {
        console.log(`   🔍 Existencia: ${exists ? 'YA EXISTE' : 'ÚNICO'}`);
      }

      // Extraer información del código
      const countryDigits = code.substring(0, 3);
      let countryName = 'Desconocido';

      // Códigos de países comunes
      const countryCodes = {
        '750': 'México',
        '751': 'Costa Rica',
        '752': 'Panamá',
        '753': 'Nicaragua',
        '754': 'Honduras',
        '755': 'El Salvador',
        '756': 'Guatemala',
        '757': 'Belice',
        '758': 'Venezuela',
        '759': 'Ecuador',
        '770': 'Colombia',
        '771': 'Perú',
        '773': 'Bolivia',
        '775': 'Perú',
        '777': 'Bolivia',
        '779': 'Argentina',
        '780': 'Chile',
        '784': 'Paraguay',
        '786': 'Uruguay',
        '790': 'Brasil'
      };

      countryName = countryCodes[countryDigits] || 'Otro país';

      console.log(`   🌍 País: ${countryName} (${countryDigits})`);

      // Tipo de producto basado en primeros dígitos
      const productType = code.substring(0, 6);
      console.log(`   📦 Tipo de producto: ${productType}...`);
    }

    console.log('');
  });

  console.log(`⏱️  Tiempo: ${duration}s`);
  console.log(`📊  Total: ${codes.length} códigos`);

  return codes;
}

// Alias para facilitar uso
window.generateBarcode = generateBarcode;
window.generateEAN13 = generateEAN13;
window.generateMultipleEAN13 = generateMultipleEAN13;
window.validateEAN13 = validateEAN13;
window.checkBarcodeExists = checkBarcodeExists;

// Ejemplos de uso rápidos
console.log(`
╔══════════════════════════════════════════════════════════════╗
║               📋 GENERADOR DE CÓDIGOS DE BARRAS EAN-13                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  💡 EJEMPLOS DE USO:                                            ║
║                                                              ║
║  // Generar un código aleatorio para Colombia                       ║
║  generateBarcode({ count: 1, prefix: '770' })                     ║
║                                                              ║
║  // Generar 5 códigos para México                                 ║
║  generateBarcode({ count: 5, prefix: '750' })                     ║
║                                                              ║
║  // Generar 10 códigos mixtos                                      ║
║  generateBarcode({ count: 10 })                                     ║
║                                                              ║
║  // Generar con validación detallada                               ║
║  generateBarcode({ count: 3, showValidation: true })             ║
║                                                              ║
║  // Verificar si un código es válido                                   ║
║  validateEAN13('7501234567890')                                    ║
║                                                              ║
║  // Generar código específico con prefijo                          ║
║  generateEAN13('7')                                              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

// Generar un código de ejemplo automáticamente
generateBarcode({
  count: 1,
  prefix: '770',
  country: 'Colombia',
  description: 'ejemplo automático',
  showValidation: true
});

console.log('\n🎯 ¡Script cargado! Usa las funciones arriba para generar códigos de barras.\n');