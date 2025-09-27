import TransactionsView from "@/components/TransactionsView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Search, Filter, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TransactionsPage() {
  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-600" />
            Consultation des Transactions
          </CardTitle>
          <CardDescription>
            Filtrez et consultez toutes vos transactions importées
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Features Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Recherche Avancée</h3>
                <p className="text-sm text-blue-700">Trouvez rapidement vos transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Filter className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Filtres Intelligents</h3>
                <p className="text-sm text-green-700">Filtrez par date, montant, type</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">Export Facile</h3>
                <p className="text-sm text-purple-700">Exportez vos données filtrées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            Liste des Transactions
          </CardTitle>
          <CardDescription>
            Consultez et gérez toutes vos transactions importées
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <TransactionsView />
        </CardContent>
      </Card>
    </div>
  );
}
