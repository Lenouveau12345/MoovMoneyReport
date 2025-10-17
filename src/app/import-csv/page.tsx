'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Database, ArrowLeft } from "lucide-react";
import BigFileUploadV2 from "@/components/BigFileUploadV2";
import UltraFastUpload from "@/components/UltraFastUpload";
import FlexibleUpload from "@/components/FlexibleUpload";
import LocalPreviewUpload from "@/components/LocalPreviewUpload";
import MegaUpload from "@/components/MegaUpload";
import CopyUpload from "@/components/CopyUpload";
import ClearDatabase from "@/components/ClearDatabase";
import ClearImportsHistory from "@/components/ClearImportsHistory";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

export default function ImportCSV() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedImport, setSelectedImport] = useState<'big' | 'ultra' | 'flexible' | 'local' | 'mega' | 'copy'>('big');

  const handleImportSuccess = () => {
    // Rafraîchir immédiatement
    setRefreshKey(prev => prev + 1);
    
    // Rafraîchir plusieurs fois avec des délais progressifs pour s'assurer que tout est synchronisé
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 1000);
    
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 3000);
    
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      router.refresh(); // Rafraîchir le routeur à la fin
    }, 5000);
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="p-6 space-y-8">
      {/* Hero Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-600" />
            Import CSV
          </CardTitle>
          <CardDescription>
            Importez vos fichiers CSV et gérez votre base de données
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Import Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              Import de Données
            </CardTitle>
            <CardDescription>
              Importez vos fichiers CSV pour analyser vos transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Sélecteur du type d'import */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type d'import</label>
              <select
                value={selectedImport}
                onChange={(e) => setSelectedImport(e.target.value as 'big' | 'ultra' | 'flexible' | 'local' | 'mega')}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="big">Import de Gros Fichiers (V2 - Robuste)</option>
                <option value="ultra">Import Ultra-Rapide</option>
                <option value="flexible">Import Flexible</option>
                <option value="local">Import Local (Aperçu puis envoi)</option>
                <option value="mega">Import Mega (Très Gros Fichiers)</option>
                <option value="copy">Import COPY (Postgres)</option>
              </select>
            </div>

            {/* Rendu conditionnel du composant d'import sélectionné */}
            <div className="pt-2">
              {selectedImport === 'big' && (
                <BigFileUploadV2 onImportSuccess={handleImportSuccess} />
              )}
              {selectedImport === 'ultra' && (
                <UltraFastUpload onImportSuccess={handleImportSuccess} />
              )}
              {selectedImport === 'flexible' && (
                <FlexibleUpload onImportSuccess={handleImportSuccess} />
              )}
              {selectedImport === 'local' && (
                <LocalPreviewUpload onImportSuccess={handleImportSuccess} />
              )}
              {selectedImport === 'mega' && (
                <MegaUpload onImportSuccess={handleImportSuccess} />
              )}
              {selectedImport === 'copy' && (
                <CopyUpload onImportSuccess={handleImportSuccess} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Database Management */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              Gestion de la Base
            </CardTitle>
            <CardDescription>
              Gérez votre base de données et nettoyez les données
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <ClearDatabase />
            <div className="border-t border-gray-200 pt-6">
              <ClearImportsHistory onClearSuccess={handleImportSuccess} />
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </ProtectedRoute>
  );
}
