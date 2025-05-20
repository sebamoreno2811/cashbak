// Servicios para la integración con Webpay y otras funcionalidades

// Función para validar el estado de un pago
export const validatePaymentStatus = (status: string, responseCode: number) => {
    if (status === "AUTHORIZED" && responseCode === 0) {
      return {
        success: true,
        message: "Pago autorizado correctamente",
      }
    }
  
    // Mapeo de códigos de respuesta de Webpay
    const responseMessages: Record<number, string> = {
      0: "Transacción aprobada",
      "-1": "Rechazo de transacción",
      "-2": "Transacción debe reintentarse",
      "-3": "Error en transacción",
      "-4": "Rechazo de transacción",
      "-5": "Rechazo por error de tasa",
      "-6": "Excede cupo máximo mensual",
      "-7": "Excede límite diario por transacción",
      "-8": "Rubro no autorizado",
    }
  
    return {
      success: false,
      message: responseMessages[responseCode] || `Error desconocido (código ${responseCode})`,
    }
  }
  
  // Función para formatear montos en formato chileno
  export const formatChileanCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount)
  }
  