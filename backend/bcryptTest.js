const bcrypt = require("bcrypt");

(async () => {
  const passwordIngresada = "123";
  const hashAlmacenado = "$2b$10$OD09B1SGM2PJIRqZqKooeJ.uQQZqHPnrBYKImYKap3tQQFfi/E6";

  const resultadoComparacion = await bcrypt.compare(passwordIngresada, hashAlmacenado);
  console.log("¿Las contraseñas coinciden?", resultadoComparacion); // Debería imprimir true si el hash es válido
})();
