"use client";
import { useState } from "react";

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onBack();
  };
  return (
    <div className="rounded-lg p-8 w-full max-w-md bg-[#f4f1f8] shadow-[20px_20px_60px_#cfcdd3,-20px_-20px_60px_#ffffff]">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#A047FF] mb-3">Recuperar tu contraseña</h1>
        <p className="text-gray-700 text-left"> <strong> Ingresá el mail </strong>para identificar la cuenta con la que tenés problemas para ingresar.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full px-4 py-3 bg-[#f4f1f8] border border-[#D4BBFC] rounded-lg text-black focus:border-[#A047FF] hover:border-[#A047FF] outline-none transition-colors duration-300 ease-in"
        />

        <button
          type="submit"
          className="w-full bg-[#A047FF] hover:bg-[#8c3de6] text-white font-semibold py-3 rounded-lg"
        >
          Enviar enlace
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-[#8c3de6] hover:bg-[#8c3de671] hover:text-[#f4f1f8] font-semibold py-2 rounded-lg transition-all duration-200 ease-in"
        >
          Volver
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
