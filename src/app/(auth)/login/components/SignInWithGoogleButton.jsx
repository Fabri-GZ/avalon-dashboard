"use client";

import { signInWithGoogle } from "../../../../../lib/auth-actions";

const SignInWithGoogleButton = () => {
    return (
        <button
        type="button"
        className="w-full"
        onClick={() => {
            signInWithGoogle();
        }}
        >Login With Google</button>
    );
};

export default SignInWithGoogleButton;