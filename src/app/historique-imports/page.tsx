'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Upload, Database } from "lucide-react";
import ImportHistoryCard from "@/components/ImportHistoryCard";
import ClearImportsHistory from "@/components/ClearImportsHistory";
import Link from "next/link";

export default function HistoriqueImports() {
  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-orange-600" />
            Historique des Imports
          </CardTitle>
          <CardDescription>
            Gérez vos imports et annulez-les si nécessaire
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/"
          className="group"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 group-hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Nouvel Import</h3>
                  <p className="text-sm text-green-700">Importer de nouveaux fichiers CSV</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link
          href="/transactions"
          className="group"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 group-hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Consulter les Transactions</h3>
                  <p className="text-sm text-blue-700">Voir toutes les transactions importées</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Historique des Imports */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              Historique des Imports
            </CardTitle>
            <CardDescription>
              Liste détaillée de tous vos imports avec possibilité de gestion
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ImportHistoryCard />
          </CardContent>
        </Card>

        {/* Vider l'Historique */}
        <ClearImportsHistory />
      </div>
    </div>
  );
}
