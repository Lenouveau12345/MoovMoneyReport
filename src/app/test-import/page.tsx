import TestCSVUpload from '@/components/TestCSVUpload';

export default function TestImportPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Test Import CSV
        </h1>
        <p className="text-gray-600 mb-8">
          Cette page permet de tester l'import CSV avec une version simplifiée 
          pour diagnostiquer les problèmes de timeout.
        </p>
        
        <TestCSVUpload />
        
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Instructions de test :</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Téléchargez un petit fichier CSV (moins de 100 lignes)</li>
            <li>• Vérifiez que les colonnes sont séparées par des virgules</li>
            <li>• La première ligne doit contenir les en-têtes</li>
            <li>• Testez d'abord avec des données simples</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
