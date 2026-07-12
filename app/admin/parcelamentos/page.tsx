import type { Metadata } from "next";
import InstallmentPlansClient from "@/components/admin/InstallmentPlansClient";

export const metadata: Metadata = {
  title: "Parcelamentos",
  robots: { index: false, follow: false },
};

export default function InstallmentPlansPage() {
  return <InstallmentPlansClient />;
}
