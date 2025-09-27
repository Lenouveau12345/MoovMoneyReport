'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TransactionDetailModal from './TransactionDetailModal';
import { 
  Search, 
  Calendar, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Eye,
  Phone,
  DollarSign,
  Clock,
  ChevronDown,
  Info
} from 'lucide-react';

interface Transaction {
  id: string;
  transactionId: string;
  transactionInitiatedTime: string;
  frmsisdn: string;
  tomsisdn: string;
  frName?: string;
  toName?: string;
  frProfile: string;
  toProfile: string;
  transactionType: string;
  originalAmount: number;
  fee: number;
  commissionAll: number;
  commissionDistributeur: number | null;
  commissionSousDistributeur: number | null;
  commissionRevendeur: number | null;
  commissionMarchand: number | null;
  merchantsOnlineCashIn: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface TransactionsData {
  transactions: Transaction[];
  pagination: Pagination;
  stats: {
    dateStats: Array<{
      date: string;
      transactionCount: number;
      totalAmount: number;
      totalFees: number;
      totalCommissions: number;
      averageAmount: number;
    }>;
    typeStats: Array<{
      transactionType: string;
      _count: { transactionId: number };
      _sum: { originalAmount: number; fee: number; commissionAll: number };
    }>;
  };
}

export default function TransactionsView() {
  const [data, setData] = useState<TransactionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [frProfiles, setFrProfiles] = useState<string[]>([]);
  const [toProfiles, setToProfiles] = useState<string[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    transactionId: '',
    frmsisdn: '',
    tomsisdn: '',
    frProfile: '',
    toProfile: '',
    transactionType: '',
    search: '',
    page: 1,
    limit: 50
  });

  const fetchTransactionTypes = async () => {
    setLoadingTypes(true);
    try {
      console.log('Chargement des types de transactions...');
      const response = await fetch('/api/transaction-types');
      const result = await response.json();

      console.log('Réponse API types:', result);

      if (response.ok) {
        setTransactionTypes(result.transactionTypes || []);
        console.log('Types de transactions chargés:', result.transactionTypes);
      } else {
        console.error('Erreur lors du chargement des types de transactions:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des types de transactions:', error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    try {
      console.log('Chargement des profils...');
      const response = await fetch('/api/transaction-profiles');
      const result = await response.json();

      console.log('Réponse API profils:', result);

      if (response.ok) {
        const frProfilesData = result.frProfiles || [];
        const toProfilesData = result.toProfiles || [];
        
        setFrProfiles(frProfilesData);
        setToProfiles(toProfilesData);
        
        console.log('Profils FR définis:', frProfilesData);
        console.log('Profils TO définis:', toProfilesData);
        console.log('État frProfiles après setState:', frProfilesData);
        console.log('État toProfiles après setState:', toProfilesData);
      } else {
        console.error('Erreur lors du chargement des profils:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des profils:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.transactionId) params.append('transactionId', filters.transactionId);
      if (filters.frmsisdn) params.append('frmsisdn', filters.frmsisdn);
      if (filters.tomsisdn) params.append('tomsisdn', filters.tomsisdn);
      if (filters.frProfile) params.append('frProfile', filters.frProfile);
      if (filters.toProfile) params.append('toProfile', filters.toProfile);
      if (filters.transactionType) params.append('transactionType', filters.transactionType);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/transactions?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        console.error('Erreur lors du chargement:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionTypes();
    fetchProfiles();
    fetchTransactions();
  }, [filters.page, filters.limit]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset à la première page lors d'un nouveau filtre
    }));
  };

  const handleSearch = () => {
    console.log('Recherche lancée avec filtres:', filters);
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      transactionId: '',
      frmsisdn: '',
      tomsisdn: '',
      frProfile: '',
      toProfile: '',
      transactionType: '',
      search: '',
      page: 1,
      limit: 50
    });
  };

  const handleTransactionHover = (transaction: Transaction, event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setMousePosition(null);
    // Délai pour permettre l'animation de fermeture
    setTimeout(() => {
      setSelectedTransaction(null);
    }, 300);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
          <CardDescription>
            Consultez les transactions importées par date et critères
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recherche générale */}
          <div>
            <Label htmlFor="search">Recherche générale</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Rechercher dans tous les champs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filtres par colonnes */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Filtres par colonnes</h4>
            
            {/* Transaction ID */}
            <div>
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                placeholder="Ex: TXN-123456..."
                value={filters.transactionId}
                onChange={(e) => handleFilterChange('transactionId', e.target.value)}
              />
            </div>

            {/* Numéros de téléphone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frmsisdn">FRMSISDN (Expéditeur)</Label>
                <Input
                  id="frmsisdn"
                  placeholder="Ex: +225 07 12 34 56 78"
                  value={filters.frmsisdn}
                  onChange={(e) => handleFilterChange('frmsisdn', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tomsisdn">TOMSISDN (Destinataire)</Label>
                <Input
                  id="tomsisdn"
                  placeholder="Ex: +225 05 67 89 01 23"
                  value={filters.tomsisdn}
                  onChange={(e) => handleFilterChange('tomsisdn', e.target.value)}
                />
              </div>
            </div>

            {/* Profils */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frProfile">FRPROFILE (Profil expéditeur)</Label>
                <div className="relative">
                  <select
                    id="frProfile"
                    value={filters.frProfile}
                    onChange={(e) => handleFilterChange('frProfile', e.target.value)}
                    disabled={loadingProfiles}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingProfiles ? 'Chargement...' : 'Tous les profils expéditeurs'}
                    </option>
                    {frProfiles.map((profile) => (
                      <option key={profile} value={profile}>
                        {profile}
                      </option>
                    ))}
                  </select>
                  {loadingProfiles ? (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  ) : (
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  )}
                </div>
                {frProfiles.length === 0 && !loadingProfiles && (
                  <p className="text-xs text-gray-500 mt-1">
                    Aucun profil expéditeur trouvé. Importez d'abord des données.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="toProfile">TOPROFILE (Profil destinataire)</Label>
                <div className="relative">
                  <select
                    id="toProfile"
                    value={filters.toProfile}
                    onChange={(e) => handleFilterChange('toProfile', e.target.value)}
                    disabled={loadingProfiles}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingProfiles ? 'Chargement...' : 'Tous les profils destinataires'}
                    </option>
                    {toProfiles.map((profile) => (
                      <option key={profile} value={profile}>
                        {profile}
                      </option>
                    ))}
                  </select>
                  {loadingProfiles ? (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  ) : (
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  )}
                </div>
                {toProfiles.length === 0 && !loadingProfiles && (
                  <p className="text-xs text-gray-500 mt-1">
                    Aucun profil destinataire trouvé. Importez d'abord des données.
                  </p>
                )}
              </div>
            </div>

            {/* Type de transaction */}
            <div>
              <Label htmlFor="transactionType">Type de transaction</Label>
              <div className="relative">
                <select
                  id="transactionType"
                  value={filters.transactionType}
                  onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                  disabled={loadingTypes}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingTypes ? 'Chargement...' : 'Tous les types'}
                  </option>
                  {transactionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {loadingTypes ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                ) : (
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                )}
              </div>
              {transactionTypes.length === 0 && !loadingTypes && (
                <p className="text-xs text-gray-500 mt-1">
                  Aucun type de transaction trouvé. Importez d'abord des données.
                </p>
              )}
            </div>
          </div>

          {/* Dates et actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Appliquer
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Effacer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-lg font-semibold">{data.pagination.total.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Montant Total</p>
                  <p className="text-lg font-semibold">
                    {formatAmount(data.transactions.reduce((sum, tx) => sum + tx.originalAmount, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Frais Totaux</p>
                  <p className="text-lg font-semibold">
                    {formatAmount(data.transactions.reduce((sum, tx) => sum + tx.fee, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Commissions Totales</p>
                  <p className="text-lg font-semibold">
                    {formatAmount(data.transactions.reduce((sum, tx) => sum + tx.commissionAll, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Page Actuelle</p>
                  <p className="text-lg font-semibold">
                    {data.pagination.page} / {data.pagination.totalPages}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions Importées</CardTitle>
          <CardDescription>
            {data && `${data.pagination.total} transactions trouvées`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Chargement...</span>
            </div>
          ) : data && data.transactions.length > 0 ? (
            <div className="space-y-4">
              {/* Tableau des transactions */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID Transaction</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">De</th>
                      <th className="text-left p-2">Vers</th>
                      <th className="text-left p-2">FRPROFILE</th>
                      <th className="text-left p-2">TOPROFILE</th>
                      <th className="text-right p-2">Montant</th>
                      <th className="text-right p-2">Frais</th>
                      <th className="text-right p-2">Comm. Total</th>
                      <th className="text-right p-2">Comm. Dist.</th>
                      <th className="text-right p-2">Comm. Sous-Dist.</th>
                      <th className="text-right p-2">Comm. Revendeur</th>
                      <th className="text-right p-2">Comm. Marchand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((transaction) => (
                      <tr 
                        key={transaction.id} 
                        className="border-b hover:bg-orange-50 hover:shadow-md transition-all duration-200 cursor-pointer group relative"
                        onMouseEnter={(e) => handleTransactionHover(transaction, e)}
                        onMouseLeave={() => {
                          // Délai pour éviter la fermeture immédiate si la souris passe sur la modale
                          setTimeout(() => {
                            if (!isModalOpen) {
                              handleCloseModal();
                            }
                          }, 100);
                        }}
                      >
                        <td className="p-2 font-mono text-xs group-hover:text-orange-700">
                          {transaction.transactionId}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Info className="w-3 h-3 text-orange-500" />
                          </div>
                        </td>
                        <td className="p-2 group-hover:text-orange-700">{formatDate(transaction.transactionInitiatedTime)}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs group-hover:bg-blue-200 transition-colors">
                            {transaction.transactionType}
                          </span>
                        </td>
                        <td className="p-2 font-mono group-hover:text-orange-700">{transaction.frmsisdn}</td>
                        <td className="p-2 font-mono group-hover:text-orange-700">{transaction.tomsisdn}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs group-hover:bg-orange-200 transition-colors">
                            {transaction.frProfile}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs group-hover:bg-green-200 transition-colors">
                            {transaction.toProfile}
                          </span>
                        </td>
                        <td className="p-2 text-right font-medium group-hover:text-orange-700">
                          {formatAmount(transaction.originalAmount)}
                        </td>
                        <td className="p-2 text-right text-gray-600 group-hover:text-orange-600">
                          {formatAmount(transaction.fee)}
                        </td>
                        <td className="p-2 text-right font-medium text-green-600 group-hover:text-green-700">
                          {formatAmount(transaction.commissionAll)}
                        </td>
                        <td className="p-2 text-right text-gray-600 group-hover:text-orange-600">
                          {transaction.commissionDistributeur ? formatAmount(transaction.commissionDistributeur) : '-'}
                        </td>
                        <td className="p-2 text-right text-gray-600 group-hover:text-orange-600">
                          {transaction.commissionSousDistributeur ? formatAmount(transaction.commissionSousDistributeur) : '-'}
                        </td>
                        <td className="p-2 text-right text-gray-600 group-hover:text-orange-600">
                          {transaction.commissionRevendeur ? formatAmount(transaction.commissionRevendeur) : '-'}
                        </td>
                        <td className="p-2 text-right text-gray-600 group-hover:text-orange-600">
                          {transaction.commissionMarchand ? formatAmount(transaction.commissionMarchand) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600">
                    Affichage de {((data.pagination.page - 1) * data.pagination.limit) + 1} à{' '}
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} sur{' '}
                    {data.pagination.total} transactions
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.pagination.page - 1)}
                      disabled={!data.pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.pagination.page + 1)}
                      disabled={!data.pagination.hasNext}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune transaction trouvée</p>
              <p className="text-sm">Essayez de modifier vos filtres</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails de transaction */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        position={mousePosition}
      />
    </div>
  );
}
