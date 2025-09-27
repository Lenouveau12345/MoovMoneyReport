'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  History, 
  Download, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Calendar,
  Database,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';

interface ImportSession {
  id: string;
  fileName: string;
  fileSize: number;
  totalRows: number;
  validRows: number;
  importedRows: number;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'CANCELLED';
  errorMessage?: string;
  importedAt: string;
  transactionCount: number;
  totalVolume: number;
  totalFees: number;
  totalCommissions: number;
  totalCommissionDistributeur: number;
  totalCommissionSousDistributeur: number;
  totalCommissionRevendeur: number;
  totalCommissionMarchand: number;
}

export default function ImportHistoryCard() {
  const [importSessions, setImportSessions] = useState<ImportSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoing, setUndoing] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const itemsPerPage = 10;

  const fetchImportHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/import-history');
      const data = await response.json();
      
      if (data.success) {
        setImportSessions(data.importSessions);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUndoImport = async (sessionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cet import ? Toutes les transactions importées seront supprimées.')) {
      return;
    }

    try {
      setUndoing(sessionId);
      const response = await fetch(`/api/import-history/undo?sessionId=${sessionId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        // Recharger l'historique
        await fetchImportHistory();
        alert(`Import annulé avec succès. ${data.deletedTransactions} transactions supprimées.`);
      } else {
        alert('Erreur lors de l\'annulation de l\'import: ' + data.error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      alert('Erreur lors de l\'annulation de l\'import');
    } finally {
      setUndoing(null);
    }
  };

  useEffect(() => {
    fetchImportHistory();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PARTIAL':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'Succès';
      case 'FAILED':
        return 'Échec';
      case 'PARTIAL':
        return 'Partiel';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return 'Inconnu';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-600 bg-green-50';
      case 'FAILED':
        return 'text-red-600 bg-red-50';
      case 'PARTIAL':
        return 'text-yellow-600 bg-yellow-50';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Filtrer et paginer les données
  const filteredSessions = importSessions.filter(session => {
    const matchesSearch = session.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = filteredSessions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset à la première page lors de la recherche
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset à la première page lors du filtrage
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des Imports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Chargement de l'historique...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des Imports
        </CardTitle>
        <p className="text-sm text-gray-600">
          Gérez vos imports et annulez-les si nécessaire
        </p>
      </CardHeader>
      <CardContent>
        {importSessions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun import trouvé</p>
            <p className="text-sm text-gray-400 mt-2">
              Importez un fichier CSV pour voir l'historique
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Barre de recherche et filtres */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom de fichier..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="SUCCESS">Succès</option>
                  <option value="FAILED">Échec</option>
                  <option value="PARTIAL">Partiel</option>
                  <option value="CANCELLED">Annulé</option>
                </select>
              </div>
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fichier</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Transactions</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Volume</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Frais</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Commissions</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Détail Comm.</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Taille</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSessions.map((session) => (
                    <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900 truncate max-w-xs" title={session.fileName}>
                            {session.fileName}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {session.importedRows} / {session.validRows} lignes importées
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(session.importedAt).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(session.importedAt).toLocaleTimeString('fr-FR')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {getStatusIcon(session.status)}
                          {getStatusText(session.status)}
                        </span>
                        {session.errorMessage && (
                          <div className="text-xs text-red-500 mt-1 truncate max-w-xs" title={session.errorMessage}>
                            {session.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          {session.transactionCount}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <span className="font-medium">{formatAmount(session.totalVolume)}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <span className="font-medium text-orange-600">{formatAmount(session.totalFees)}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <span className="font-medium text-purple-600">{formatAmount(session.totalCommissions)}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div className="text-xs space-y-1">
                          {session.totalCommissionDistributeur > 0 && (
                            <div className="text-blue-600">Dist: {formatAmount(session.totalCommissionDistributeur)}</div>
                          )}
                          {session.totalCommissionSousDistributeur > 0 && (
                            <div className="text-green-600">Sous-Dist: {formatAmount(session.totalCommissionSousDistributeur)}</div>
                          )}
                          {session.totalCommissionRevendeur > 0 && (
                            <div className="text-orange-600">Rev: {formatAmount(session.totalCommissionRevendeur)}</div>
                          )}
                          {session.totalCommissionMarchand > 0 && (
                            <div className="text-red-600">March: {formatAmount(session.totalCommissionMarchand)}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatFileSize(session.fileSize)}
                      </td>
                      <td className="py-3 px-4">
                        {session.status === 'SUCCESS' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUndoImport(session.id)}
                            disabled={undoing === session.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {undoing === session.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            <span className="ml-1 hidden sm:inline">Annuler</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Affichage de {startIndex + 1} à {Math.min(endIndex, filteredSessions.length)} sur {filteredSessions.length} imports
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
