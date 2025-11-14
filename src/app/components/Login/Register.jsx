"use client";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdLock, MdMail, MdPerson } from "react-icons/md";

const Register = ({ onBack, onLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onBack();
  };

  return (
    <div className="rounded-lg p-8 w-full max-w-md mx-auto bg-[#f4f1f8] shadow-[20px_20px_60px_#cfcdd3,-20px_-20px_60px_#ffffff]">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-[#A047FF] mb-2">Crear Cuenta</h1>
        <p className="text-gray-700">Unite al Dashboard de Avalon</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative mb-3">
          <MdPerson className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
          className="w-full pl-10 pr-4 py-3 bg-[#f4f1f8] border border-[#D4BBFC] rounded-lg text-black focus:border-[#A047FF] hover:border-[#A047FF] outline-none transition-colors duration-300 ease-in"
          />
        </div>

        <div className="relative mb-3">
          <MdMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full pl-10 pr-4 py-3 bg-[#f4f1f8] border border-[#D4BBFC] rounded-lg text-black focus:border-[#A047FF] hover:border-[#A047FF] outline-none transition-colors duration-300 ease-in"
          />
        </div>
       <div className="relative mb-3">
          <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18}/>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            className="w-full pl-10 pr-4 py-3 bg-[#f4f1f8] border border-[#D4BBFC] rounded-lg text-black focus:border-[#A047FF] hover:border-[#A047FF] outline-none transition-colors duration-300 ease-in" 
            />
          <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-[#A047FF] transition-colors"
              >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
        </div>

        <button
          type="submit"
          className="w-full bg-[#A047FF] hover:bg-[#8c3de6] text-white font-semibold py-3 rounded-lg transition-colors duration-300 ease-in"
        >
          Registrarse
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-[#8c3de6] hover:bg-[#8c3de671] hover:text-[#f4f1f8] font-semibold py-2 rounded-lg transition-all duration-200 ease-in"
        >
          Volver al inicio
        </button>

        <div className="flex items-center my-4">
          <hr className="grow border-t border-gray-700" />
          <span className="px-3 text-gray-500 text-sm">o</span>
          <hr className="grow border-t border-gray-700" />
        </div>

        <button
          type="button"
          onClick={() => console.log("Google signup")}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-lg transition-all duration-200 ease-in"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google logo"
            className="w-5 h-5"
          />
          Registrarse con Google
        </button>
      </form>
    </div>
  );
};

export default Register;
