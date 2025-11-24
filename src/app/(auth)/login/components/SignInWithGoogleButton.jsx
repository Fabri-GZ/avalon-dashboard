"use client";

import { signInWithGoogle } from "@/lib/auth-actions";

const SignInWithGoogleButton = () => {
    return (
        <button
          type="button"
          onClick={() => { signInWithGoogle();
          }}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-lg transition-all duration-200 ease-in"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google logo"
            className="w-5 h-5"
          />
          Registrarse con Google
        </button>
    );
};

export default SignInWithGoogleButton;