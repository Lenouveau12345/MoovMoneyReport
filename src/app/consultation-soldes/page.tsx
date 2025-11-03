'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Search, 
  Wallet, 
  ArrowRight, 
  Users, 
  TrendingUp,
  DollarSign,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LastTransaction {
  transactionId: string;
  transactionInitiatedTime: Date;
  originalAmount: number;
  transactionType: string;
}

interface Recipient {
  tomsisdn: string;
  toName?: string | null;
  toProfile: string;
  transactionsCount: number;
  lastTransaction: LastTransaction | null;
  finalBalance: number | null; // Solde après la dernière transaction
  transactions: Array<{
    transactionId: string;
    transactionInitiatedTime: Date;
    originalAmount: number;
    transactionType: string;
  }>;
}

interface FromBalance {
  origBalanceBefore: number | null;
  origBalanceAfter: number | null;
}

interface FromData {
  frmsisdn: string;
  frName?: string | null;
  frProfile: string;
  lastOrigBalance: FromBalance | null;
  recipientsCount: number;
  recipients: Recipient[];
}

interface BalancesData {
  date: string;
  totalFromNumbers: number;
  totalTransactions: number;
  data: FromData[];
}

export default function ConsultationSoldes() {
  const [data, setData] = useState<BalancesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [useDateRange, setUseDateRange] = useState(false);
  const [expandedFrom, setExpandedFrom] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/balances-by-date?';
      if (useDateRange && fromDate && toDate) {
        url += `fromDate=${fromDate}&toDate=${toDate}`;
      } else {
        url += `date=${selectedDate}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        console.error('Erreur:', result);
        alert('Erreur lors du chargement des données');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fonction pour formater les numéros de téléphone (gère la notation scientifique)
  const formatPhoneNumber = (phone: string | null | undefined): string => {
    if (!phone) return '';
    // Si le numéro contient la notation scientifique (E+), le convertir
    if (typeof phone === 'string' && (phone.includes('E+') || phone.includes('e+') || phone.includes('E-') || phone.includes('e-'))) {
      try {
        const num = parseFloat(phone);
        if (!isNaN(num)) {
          // Convertir en entier et retourner en string (sans notation scientifique)
          return Math.floor(num).toString();
        }
      } catch (e) {
        // Si la conversion échoue, retourner tel quel
      }
    }
    return phone;
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpanded = (fromKey: string) => {
    const newExpanded = new Set(expandedFrom);
    if (newExpanded.has(fromKey)) {
      newExpanded.delete(fromKey);
    } else {
      newExpanded.add(fromKey);
    }
    setExpandedFrom(newExpanded);
  };

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Consultation des Soldes par Date
          </h1>
          <p className="text-gray-600">
            Consultez les soldes des transactions groupées par expéditeur (FROM) et leurs destinataires (TO)
          </p>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filtres de Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useDateRange"
                  checked={useDateRange}
                  onChange={(e) => setUseDateRange(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="useDateRange">Plage de dates</Label>
              </div>
              
              {useDateRange ? (
                <>
                  <div>
                    <Label htmlFor="fromDate">Date de début</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="toDate">Date de fin</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={fetchData} className="w-full">
                      <Search className="h-4 w-4 mr-2" />
                      Rechercher
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={fetchData} className="w-full">
                      <Search className="h-4 w-4 mr-2" />
                      Rechercher
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Expéditeurs (FROM)</p>
                    <p className="text-2xl font-bold">{data.totalFromNumbers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Transactions Total</p>
                    <p className="text-2xl font-bold">{data.totalTransactions.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="text-lg font-semibold">{data.date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Liste des expéditeurs */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
              <p className="text-gray-600">Chargement des données...</p>
            </CardContent>
          </Card>
        ) : data && data.data.length > 0 ? (
          <div className="space-y-4">
            {data.data.map((fromData) => {
              const isExpanded = expandedFrom.has(fromData.frmsisdn);
              return (
                <Card key={fromData.frmsisdn} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Wallet className="h-5 w-5 text-orange-600" />
                          <span className="font-mono">{formatPhoneNumber(fromData.frmsisdn)}</span>
                          {fromData.frName && (
                            <span className="text-sm font-normal text-gray-600">
                              ({fromData.frName})
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                            {fromData.frProfile}
                          </span>
                          <span className="ml-3 text-gray-600">
                            {fromData.recipientsCount} destinataire{fromData.recipientsCount > 1 ? 's' : ''}
                          </span>
                        </CardDescription>
                        {/* Solde de l'expéditeur */}
                        {fromData.lastOrigBalance && (
                          <div className="mt-3 p-3 bg-orange-50 rounded border border-orange-200">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium text-gray-700">
                                Solde de l'expéditeur
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Avant:</span>
                                <span className="ml-1 font-semibold text-orange-700">
                                  {fromData.lastOrigBalance.origBalanceBefore !== null 
                                    ? formatAmount(fromData.lastOrigBalance.origBalanceBefore) 
                                    : '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Après:</span>
                                <span className="ml-1 font-semibold text-orange-700">
                                  {fromData.lastOrigBalance.origBalanceAfter !== null 
                                    ? formatAmount(fromData.lastOrigBalance.origBalanceAfter) 
                                    : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpanded(fromData.frmsisdn)}
                      >
                        {isExpanded ? 'Réduire' : 'Développer'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {fromData.recipients.map((recipient) => (
                        <Card 
                          key={recipient.tomsisdn}
                          className="border-l-2 border-l-blue-400 bg-blue-50/50"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {/* Solde final - MIS EN ÉVIDENCE EN PREMIER EN ROUGE */}
                                {recipient.finalBalance !== null && recipient.finalBalance !== undefined ? (
                                  <div className="mb-4 p-5 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border-3 border-red-500 shadow-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="p-3 bg-red-600 rounded-full shadow-md">
                                          <DollarSign className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                          <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                                            Solde Final
                                          </span>
                                          <p className="text-xs text-gray-600 mt-0.5">Après dernière transaction</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-3xl font-extrabold text-red-600 drop-shadow-sm">
                                          {formatAmount(recipient.finalBalance)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mb-4 p-3 bg-gray-100 rounded border border-gray-300">
                                    <div className="flex items-center gap-2 text-gray-500">
                                      <DollarSign className="h-4 w-4" />
                                      <span className="text-sm">Solde non disponible</span>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 mb-3">
                                  <ArrowRight className="h-4 w-4 text-blue-600" />
                                  <span className="font-mono font-semibold text-base">{formatPhoneNumber(recipient.tomsisdn)}</span>
                                  {recipient.toName && (
                                    <span className="text-sm text-gray-600">
                                      ({recipient.toName})
                                    </span>
                                  )}
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                    {recipient.toProfile}
                                  </span>
                                </div>

                                {/* Dernière transaction */}
                                {recipient.lastTransaction && (
                                  <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Clock className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm font-medium text-gray-700">
                                        Dernière transaction
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-600">ID:</span>
                                        <span className="ml-1 font-mono text-xs">{recipient.lastTransaction.transactionId}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Date:</span>
                                        <span className="ml-1">{formatDateTime(recipient.lastTransaction.transactionInitiatedTime)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Montant:</span>
                                        <span className="ml-1 font-semibold">{formatAmount(recipient.lastTransaction.originalAmount)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Type:</span>
                                        <span className="ml-1 px-2 py-0.5 bg-gray-200 rounded text-xs">
                                          {recipient.lastTransaction.transactionType}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Nombre de transactions */}
                                <div className="mt-2 text-xs text-gray-500">
                                  {recipient.transactionsCount} transaction{recipient.transactionsCount > 1 ? 's' : ''} au total
                                </div>
                              </div>
                            </div>

                            {/* Liste des transactions (si développé) */}
                            {isExpanded && recipient.transactions.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-semibold mb-2">Dernières transactions:</h4>
                                <div className="space-y-2">
                                  {recipient.transactions.map((tx) => (
                                    <div 
                                      key={tx.transactionId}
                                      className="p-2 bg-white rounded border border-gray-100 text-xs"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono">{tx.transactionId}</span>
                                        <span className="text-gray-600">
                                          {formatDateTime(tx.transactionInitiatedTime)}
                                        </span>
                                        <span className="font-semibold">{formatAmount(tx.originalAmount)}</span>
                                        <span className="px-2 py-0.5 bg-gray-200 rounded">
                                          {tx.transactionType}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">Aucune donnée trouvée pour cette date</p>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
}

