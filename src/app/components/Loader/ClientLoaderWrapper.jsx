"use client";

import { usePathname } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import Loader from "./loader";

export default function ClientLoaderWrapper({ children }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    startTransition(() => {});
  }, [pathname]);

  useEffect(() => {
    if (!isPending) {
      const t = setTimeout(() => setLoading(false), 150);
      return () => clearTimeout(t);
    }
  }, [isPending]);

  return (
    <>
      {loading && <Loader />}
      {children}
    </>
  );
}
