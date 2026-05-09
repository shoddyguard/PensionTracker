import { createPension } from "@/actions/pensions";
import { PensionForm } from "@/components/pensions/pension-form";
import Link from "next/link";

export default function NewPensionPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/pensions" className="text-sm text-gray-500 hover:text-gray-900">
          ← Pensions
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Add Pension</h1>
      </div>
      <PensionForm action={createPension} cancelHref="/pensions" />
    </div>
  );
}
