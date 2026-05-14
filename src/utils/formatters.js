// ==========================================================
// UTILIDADES DE FORMATEO
// ==========================================================
//
// Este archivo contiene funciones helper reutilizables
// para transformar datos a formatos visuales amigables.
//
// Funcionalidades:
//
// ✅ Formatear moneda COP
// ✅ Formatear fechas
// ✅ Formatear horas
// ✅ Formatear fecha + hora
//
// Objetivo:
// mantener consistencia visual en toda la aplicación.
//
// Porque mostrar:
// 1500000
//
// en vez de:
// $ 1.500.000
//
// es una experiencia visual tan agradable
// como pisar un Lego descalzo.
//
// ==========================================================



// ==========================================================
// FORMAT CURRENCY
// ==========================================================
//
// Formatea números como moneda colombiana (COP).
//
// Ejemplo:
//
// Input:
// 150000
//
// Output:
// $ 150.000
//
// ==========================================================

export const formatCurrency = (amount) =>


  // ========================================================
  // Intl.NumberFormat
  // ========================================================
  //
  // API nativa de JavaScript para internacionalización.
  //
  // Permite formatear:
  //
  // - monedas
  // - números
  // - porcentajes
  //
  // según configuraciones regionales.
  //
  // Mucho mejor que inventar regex extrañas
  // a las 3 AM como alquimista frontend.
  //
  // ========================================================

  new Intl.NumberFormat(


    // ------------------------------------------------------
    // CONFIGURACIÓN REGIONAL
    // ------------------------------------------------------
    //
    // "es-CO"
    //
    // Español Colombia.
    //
    // Define:
    //
    // - separador miles
    // - separador decimal
    // - símbolo moneda
    //
    // Ejemplo:
    //
    // 1.500.000
    //
    // y no:
    //
    // 1,500,000
    //
    // porque no estamos vendiendo hamburguesas en Ohio.
    // ------------------------------------------------------

    "es-CO",


    // ------------------------------------------------------
    // OPCIONES DE FORMATEO
    // ------------------------------------------------------

    {


      // ----------------------------------------------------
      // style: "currency"
      // ----------------------------------------------------
      //
      // Indica que el valor será moneda.
      //
      // Agrega automáticamente:
      //
      // $
      //
      // ----------------------------------------------------

      style: "currency",


      // ----------------------------------------------------
      // currency: "COP"
      // ----------------------------------------------------
      //
      // Define moneda:
      //
      // COP = Peso Colombiano
      //
      // ----------------------------------------------------

      currency: "COP",


      // ----------------------------------------------------
      // minimumFractionDigits: 0
      // ----------------------------------------------------
      //
      // Elimina decimales obligatorios.
      //
      // Ejemplo:
      //
      // $ 15.000
      //
      // y NO:
      //
      // $ 15.000,00
      //
      // Ideal para POS y ventas rápidas.
      // Nadie quiere ver centavos fantasma
      // en cafeterías pequeñas.
      // ----------------------------------------------------

      minimumFractionDigits: 0,
    },


    // ======================================================
    // FORMAT
    // ======================================================
    //
    // Convierte el número al formato configurado.
    //
    // amount || 0
    //
    // Si amount es:
    // - null
    // - undefined
    // - false
    //
    // usa 0 como fallback.
    //
    // Evita errores visuales:
    //
    // "$ NaN"
    //
    // que siempre inspira muchísima confianza financiera.
    //
    // ======================================================

  ).format(amount || 0);




// ==========================================================
// FORMAT DATE
// ==========================================================
//
// Formatea fechas al formato colombiano.
//
// Ejemplo:
//
// Input:
// 2026-05-14T12:00:00
//
// Output:
// 14 may 2026
//
// ==========================================================

export const formatDate = (dateStr) =>


  // ========================================================
  // CREAR OBJETO DATE
  // ========================================================
  //
  // Convierte string a objeto Date.
  //
  // ========================================================

  new Date(dateStr)


    // ======================================================
    // toLocaleDateString
    // ======================================================
    //
    // Formatea fecha según región.
    //
    // ======================================================

    .toLocaleDateString(


      // ----------------------------------------------------
      // CONFIGURACIÓN REGIONAL
      // ----------------------------------------------------

      "es-CO",


      // ----------------------------------------------------
      // OPCIONES DE FORMATO
      // ----------------------------------------------------

      {


        // --------------------------------------------------
        // year: "numeric"
        // --------------------------------------------------
        //
        // Año completo.
        //
        // Ejemplo:
        // 2026
        //
        // --------------------------------------------------

        year: "numeric",


        // --------------------------------------------------
        // month: "short"
        // --------------------------------------------------
        //
        // Mes abreviado.
        //
        // Ejemplo:
        // ene
        // feb
        // mar
        //
        // Más compacto y elegante.
        // Como los commits que la gente promete hacer.
        //
        // --------------------------------------------------

        month: "short",


        // --------------------------------------------------
        // day: "numeric"
        // --------------------------------------------------
        //
        // Día numérico.
        //
        // Ejemplo:
        // 14
        //
        // --------------------------------------------------

        day: "numeric",
      },
    );




// ==========================================================
// FORMAT TIME
// ==========================================================
//
// Formatea horas.
//
// Ejemplo:
//
// Input:
// 2026-05-14T15:30:00
//
// Output:
// 03:30 p. m.
//
// ==========================================================

export const formatTime = (dateStr) =>

  new Date(dateStr).toLocaleTimeString(


    // ------------------------------------------------------
    // CONFIGURACIÓN REGIONAL
    // ------------------------------------------------------

    "es-CO",


    // ------------------------------------------------------
    // OPCIONES
    // ------------------------------------------------------

    {


      // ----------------------------------------------------
      // hour: "2-digit"
      // ----------------------------------------------------
      //
      // Hora con dos dígitos.
      //
      // Ejemplo:
      // 03
      //
      // ----------------------------------------------------

      hour: "2-digit",


      // ----------------------------------------------------
      // minute: "2-digit"
      // ----------------------------------------------------
      //
      // Minutos con dos dígitos.
      //
      // Ejemplo:
      // 05
      //
      // ----------------------------------------------------

      minute: "2-digit",
    },
  );




// ==========================================================
// FORMAT DATE TIME
// ==========================================================
//
// Combina fecha + hora.
//
// Ejemplo:
//
// Input:
// 2026-05-14T15:30:00
//
// Output:
// 14 may 2026 03:30 p. m.
//
// ==========================================================

export const formatDateTime = (dateStr) =>


  // ========================================================
  // TEMPLATE STRING
  // ========================================================
  //
  // Reutiliza funciones previas:
  //
  // formatDate()
  // formatTime()
  //
  // Beneficios:
  //
  // ✅ Código reutilizable
  // ✅ Más mantenible
  // ✅ Evita duplicación
  // ✅ Consistencia visual
  //
  // Lo opuesto a copiar y pegar funciones
  // hasta que el proyecto parece fanfiction.
  //
  // ========================================================

  `${formatDate(dateStr)} ${formatTime(dateStr)}`;





// ==========================================================
// EJEMPLOS DE USO
// ==========================================================


// ----------------------------------------------------------
// MONEDA
// ----------------------------------------------------------
//
// formatCurrency(25000)
//
// Resultado:
// "$ 25.000"
//
// ----------------------------------------------------------


// ----------------------------------------------------------
// FECHA
// ----------------------------------------------------------
//
// formatDate("2026-05-14")
//
// Resultado:
// "14 may 2026"
//
// ----------------------------------------------------------


// ----------------------------------------------------------
// HORA
// ----------------------------------------------------------
//
// formatTime("2026-05-14T15:30:00")
//
// Resultado:
// "03:30 p. m."
//
// ----------------------------------------------------------


// ----------------------------------------------------------
// FECHA + HORA
// ----------------------------------------------------------
//
// formatDateTime("2026-05-14T15:30:00")
//
// Resultado:
// "14 may 2026 03:30 p. m."
//
// ----------------------------------------------------------





// ==========================================================
// VENTAJAS DE ESTE ENFOQUE
// ==========================================================
//
// ✅ Reutilizable
// ✅ Consistente
// ✅ Fácil mantenimiento
// ✅ Internacionalización nativa
// ✅ Código limpio
// ✅ Evita duplicación
// ✅ Mejor experiencia visual
//
// Son utilidades pequeñas,
// pero terminan usadas literalmente en todo el sistema.
// Como el café en oficinas de desarrollo:
// infraestructura crítica.
//
// ==========================================================