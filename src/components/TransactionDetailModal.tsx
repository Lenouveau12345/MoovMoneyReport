'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Calendar, 
  Phone, 
  DollarSign, 
  User, 
  Hash, 
  Building, 
  CreditCard,
  Clock,
  FileText,
  TrendingUp,
  Users,
  Shield
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
  updatedAt: string;
}

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export default function TransactionDetailModal({ transaction, isOpen, onClose, position }: TransactionDetailModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isVisible || !transaction) return null;

  // Calculer la position de la tooltip
  const tooltipStyle = position ? {
    position: 'fixed' as const,
    left: `${position.x + 10}px`,
    top: `${position.y - 10}px`,
    zIndex: 9999,
  } : {};

  return (
    <div 
      className={`fixed z-50 transition-all duration-200 ${
        isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      style={tooltipStyle}
    >
      {/* Tooltip Arrow */}
      <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l-2 border-t-2 border-orange-200 transform rotate-45"></div>
      
      {/* Tooltip Content */}
      <div className="bg-white border-2 border-orange-200 rounded-xl shadow-2xl max-w-4xl w-[600px] overflow-hidden">
        {/* Header compact */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Détails Transaction</h3>
              <p className="text-sm text-orange-100 font-mono">{transaction.transactionId}</p>
            </div>
          </div>
        </div>

        {/* Content compact */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Informations principales */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5 text-orange-600" />
                <span className="text-base font-bold text-black">Informations</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Date:</span>
                  <span className="font-semibold text-black">{new Date(transaction.transactionInitiatedTime).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Type:</span>
                  <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded text-sm font-semibold">
                    {transaction.transactionType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Heure:</span>
                  <span className="font-semibold text-black">{new Date(transaction.transactionInitiatedTime).toLocaleTimeString('fr-FR')}</span>
                </div>
              </div>
            </div>

            {/* Montants */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-orange-600" />
                <span className="text-base font-bold text-black">Montants</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Original:</span>
                  <span className="font-bold text-black">{formatAmount(transaction.originalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Frais:</span>
                  <span className="font-semibold text-orange-600">{formatAmount(transaction.fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Commission:</span>
                  <span className="font-semibold text-orange-600">{formatAmount(transaction.commissionAll)}</span>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-orange-600" />
                <span className="text-base font-bold text-black">Participants</span>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-700 font-medium">Expéditeur:</span>
                  </div>
                  <p className="font-mono text-sm text-black ml-6 font-semibold">
                    {transaction.frmsisdn.includes('E+') 
                      ? parseInt(transaction.frmsisdn).toLocaleString('fr-FR')
                      : transaction.frmsisdn
                    }
                  </p>
                  {transaction.frName && (
                    <p className="text-sm text-gray-600 ml-6 mt-1 font-medium">
                      {transaction.frName}
                    </p>
                  )}
                  <span className="inline-block px-3 py-1 bg-orange-200 text-orange-800 rounded text-sm ml-6 mt-2 font-semibold">
                    {transaction.frProfile}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-700 font-medium">Destinataire:</span>
                  </div>
                  <p className="font-mono text-sm text-black ml-6 font-semibold">
                    {transaction.tomsisdn.includes('E+') 
                      ? parseInt(transaction.tomsisdn).toLocaleString('fr-FR')
                      : transaction.tomsisdn
                    }
                  </p>
                  {transaction.toName && (
                    <p className="text-sm text-gray-600 ml-6 mt-1 font-medium">
                      {transaction.toName}
                    </p>
                  )}
                  <span className="inline-block px-3 py-1 bg-orange-200 text-orange-800 rounded text-sm ml-6 mt-2 font-semibold">
                    {transaction.toProfile}
                  </span>
                </div>
              </div>
            </div>

            {/* Commissions détaillées */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-base font-bold text-black">Commissions</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Distributeur:</span>
                  <span className="font-semibold text-black">
                    {transaction.commissionDistributeur ? formatAmount(transaction.commissionDistributeur) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Sous-Dist.:</span>
                  <span className="font-semibold text-black">
                    {transaction.commissionSousDistributeur ? formatAmount(transaction.commissionSousDistributeur) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Revendeur:</span>
                  <span className="font-semibold text-black">
                    {transaction.commissionRevendeur ? formatAmount(transaction.commissionRevendeur) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Marchand:</span>
                  <span className="font-semibold text-black">
                    {transaction.commissionMarchand ? formatAmount(transaction.commissionMarchand) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
