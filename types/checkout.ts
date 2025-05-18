export interface CheckoutFormData {
    fullName: string
    email: string
    phone: string
    bankName: string
    accountType: string
    accountNumber: string
    rut: string
  }
  
  export interface FormErrors {
    fullName?: string
    email?: string
    phone?: string
    bankName?: string
    accountType?: string
    accountNumber?: string
    rut?: string
  }
  