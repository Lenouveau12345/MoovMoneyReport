import TwoStepImport from '@/components/TwoStepImport';

export default function ImportTwoStepsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Import CSV en Deux Étapes
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="font-medium text-blue-800 mb-2">Comment ça fonctionne ?</h2>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Étape 1:</strong> Upload du fichier CSV sur le serveur</p>
              <p><strong>Étape 2:</strong> Traitement et import des données en base</p>
            </div>
          </div>
        </div>
        
        <TwoStepImport />
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">✅ Avantages</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Pas de timeout sur les gros fichiers</li>
              <li>• Vérification du fichier avant traitement</li>
              <li>• Traitement asynchrone fiable</li>
              <li>• Possibilité de retraiter</li>
              <li>• Suivi détaillé du processus</li>
            </ul>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">📝 Instructions</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Utilisez un fichier CSV valide</li>
              <li>• Colonnes séparées par des virgules</li>
              <li>• Première ligne = en-têtes</li>
              <li>• Testez d'abord avec un petit fichier</li>
              <li>• Vérifiez le résultat avant de continuer</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
