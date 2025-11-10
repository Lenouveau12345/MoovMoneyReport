'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface ExecutiveReportGeneratorProps {
  period: string;
  customDateRange?: { from?: Date; to?: Date };
}

interface ReportData {
  period: string;
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalTransactions: number;
    totalVolume: number;
    totalFees: number;
    totalCommissions: number;
    totalCommissionDistributeur: number;
    totalCommissionSousDistributeur: number;
    totalCommissionRevendeur: number;
    totalCommissionMarchand: number;
    averageTransactionAmount: number;
  };
  breakdown: {
    byType: Array<{
      transactionType: string;
      _count: {
        transactionId: number;
      };
      _sum: {
        originalAmount: number;
        fee: number;
        commissionAll: number;
        commissionDistributeur: number;
        commissionSousDistributeur: number;
        commissionRevendeur: number;
        commissionMarchand: number;
      };
    }>;
  };
  topTransactions: Array<{
    transactionId: string;
    originalAmount: number;
    fee: number;
    commissionAll: number;
    transactionType: string;
    transactionInitiatedTime: string;
  }>;
  uniqueUsers?: number;
  transactionTypesCount?: number;
}

export default function ExecutiveReportGenerator({ period, customDateRange }: ExecutiveReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatDate = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPeriodLabel = (): string => {
    if (customDateRange?.from && customDateRange?.to) {
      return `Période personnalisée : Du ${formatDate(customDateRange.from)} au ${formatDate(customDateRange.to)}`;
    }
    switch (period) {
      case 'day':
        return 'Aujourd\'hui';
      case 'week':
        return 'Cette semaine';
      case 'month':
        return 'Ce mois';
      case 'year':
        return 'Cette année';
      default:
        return 'Période sélectionnée';
    }
  };

  const fetchReportData = async (): Promise<ReportData> => {
    // Construire l'URL avec les paramètres de période
    let url = `/api/reports-simple?period=${period}`;
    if (customDateRange?.from && customDateRange?.to) {
      url += `&dateFrom=${customDateRange.from.toISOString()}&dateTo=${customDateRange.to.toISOString()}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    // Récupérer les données supplémentaires
    let uniqueUsers = 0;
    let transactionTypesCount = 0;

    try {
      const uniqueUsersResponse = await fetch('/api/stats/unique-users');
      const uniqueUsersData = await uniqueUsersResponse.json();
      uniqueUsers = uniqueUsersData.count || 0;

      const transactionTypesResponse = await fetch('/api/stats/transaction-types');
      const transactionTypesData = await transactionTypesResponse.json();
      transactionTypesCount = transactionTypesData.count || 0;
    } catch (error) {
      console.warn('Erreur lors de la récupération des données supplémentaires:', error);
    }

    return {
      ...data,
      uniqueUsers,
      transactionTypesCount,
    };
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const reportData = await fetchReportData();

      // Créer un nouveau document PDF en format A4 portrait
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Fonction pour ajouter une nouvelle page si nécessaire
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Fonction pour dessiner une ligne de séparation
      const drawSeparator = () => {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
      };

      // Fonction pour ajouter un titre de section
      const addSectionTitle = (title: string, fontSize: number = 16) => {
        checkPageBreak(15);
        yPosition += 10;
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(51, 51, 51);
        pdf.text(title, margin, yPosition);
        yPosition += 8;
        drawSeparator();
      };

      // Fonction pour ajouter du texte
      const addText = (text: string, fontSize: number = 11, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
        checkPageBreak(10);
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setTextColor(51, 51, 51);
        const xPosition = align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - margin : margin;
        pdf.text(text, xPosition, yPosition, { align });
        yPosition += fontSize * 0.5 + 2;
      };

      // Fonction pour créer un tableau de statistiques
      const addStatsTable = (title: string, data: Array<{ label: string; value: string }>) => {
        checkPageBreak(20);
        addText(title, 12, true);
        yPosition += 3;

        const colWidth = contentWidth / 2;
        let xPos = margin;

        data.forEach((item, index) => {
          if (index % 2 === 0 && index > 0) {
            yPosition += 8;
            xPos = margin;
            checkPageBreak(10);
          }

          // Fond gris clair pour les lignes impaires
          if (index % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(xPos, yPosition - 6, colWidth, 8, 'F');
          }

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(102, 102, 102);
          pdf.text(item.label, xPos + 3, yPosition);

          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(51, 51, 51);
          pdf.text(item.value, xPos + colWidth - 10, yPosition, { align: 'right' });

          if (index % 2 === 0) {
            xPos += colWidth;
          }
        });

        yPosition += 10;
      };

      // PAGE DE GARDE
      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Titre principal
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 58, 138); // Bleu foncé
      pdf.text('RAPPORT D\'ACTIVITÉ', pageWidth / 2, 60, { align: 'center' });

      // Sous-titre
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(51, 51, 51);
      pdf.text('Analyse des Transactions', pageWidth / 2, 75, { align: 'center' });

      // Période
      pdf.setFontSize(14);
      pdf.setTextColor(102, 102, 102);
      pdf.text(getPeriodLabel(), pageWidth / 2, 95, { align: 'center' });

      // Date de génération
      pdf.setFontSize(11);
      const generationDate = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      pdf.text(`Généré le ${generationDate}`, pageWidth / 2, 110, { align: 'center' });

      // Ligne de séparation décorative
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(2);
      pdf.line(margin, 125, pageWidth - margin, 125);

      // Note confidentielle
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Document confidentiel - Usage interne', pageWidth / 2, 260, { align: 'center' });

      // PAGE 2 : RÉSUMÉ EXÉCUTIF
      pdf.addPage();
      yPosition = margin;

      addSectionTitle('RÉSUMÉ EXÉCUTIF', 18);

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(51, 51, 51);
      const executiveSummary = `Ce rapport présente une analyse complète des transactions pour la période sélectionnée. ` +
        `Il contient les statistiques clés, les tendances, et les analyses détaillées nécessaires ` +
        `pour la prise de décision stratégique au sein du conseil d'administration.`;
      pdf.text(executiveSummary, margin, yPosition, { maxWidth: contentWidth, align: 'justify' });
      yPosition += 15;

      // Statistiques clés en tableau
      addStatsTable('STATISTIQUES CLÉS', [
        { label: 'Total des Transactions', value: formatNumber(reportData.summary.totalTransactions) },
        { label: 'Volume Total', value: formatAmount(reportData.summary.totalVolume) },
        { label: 'Frais Totaux', value: formatAmount(reportData.summary.totalFees) },
        { label: 'Commissions Totales', value: formatAmount(reportData.summary.totalCommissions) },
        { label: 'Montant Moyen par Transaction', value: formatAmount(reportData.summary.averageTransactionAmount) },
        { label: 'Utilisateurs Uniques', value: reportData.uniqueUsers ? formatNumber(reportData.uniqueUsers) : 'N/A' },
      ]);

      // PAGE 3 : DÉTAIL DES COMMISSIONS
      checkPageBreak(30);
      addSectionTitle('DÉTAIL DES COMMISSIONS', 18);

      addStatsTable('RÉPARTITION DES COMMISSIONS', [
        { label: 'Commissions Distributeur', value: formatAmount(reportData.summary.totalCommissionDistributeur) },
        { label: 'Commissions Sous-Distributeur', value: formatAmount(reportData.summary.totalCommissionSousDistributeur) },
        { label: 'Commissions Revendeur', value: formatAmount(reportData.summary.totalCommissionRevendeur) },
        { label: 'Commissions Marchand', value: formatAmount(reportData.summary.totalCommissionMarchand) },
      ]);

      // Calcul des pourcentages
      const totalCommissions = reportData.summary.totalCommissions;
      if (totalCommissions > 0) {
        yPosition += 5;
        addText('Répartition en pourcentage:', 11, true);
        yPosition += 3;

        const commissions = [
          { label: 'Distributeur', value: reportData.summary.totalCommissionDistributeur },
          { label: 'Sous-Distributeur', value: reportData.summary.totalCommissionSousDistributeur },
          { label: 'Revendeur', value: reportData.summary.totalCommissionRevendeur },
          { label: 'Marchand', value: reportData.summary.totalCommissionMarchand },
        ];

        commissions.forEach((item, index) => {
          if (item.value > 0) {
            const percentage = (item.value / totalCommissions) * 100;
            const colWidth = contentWidth / 2;
            const xPos = margin + (index % 2) * colWidth;

            if (index % 2 === 0 && index > 0) {
              yPosition += 8;
              checkPageBreak(10);
            }

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(102, 102, 102);
            pdf.text(`${item.label}:`, xPos + 3, yPosition);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(51, 51, 51);
            pdf.text(`${percentage.toFixed(2)}%`, xPos + colWidth - 10, yPosition, { align: 'right' });
          }
        });
        yPosition += 10;
      }

      // PAGE 4 : RÉPARTITION PAR TYPE DE TRANSACTION
      if (reportData.breakdown.byType && reportData.breakdown.byType.length > 0) {
        checkPageBreak(40);
        addSectionTitle('RÉPARTITION PAR TYPE DE TRANSACTION', 18);

        // En-tête du tableau
        yPosition += 3;
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPosition - 6, contentWidth, 8, 'F');

        const colWidths = [contentWidth * 0.35, contentWidth * 0.15, contentWidth * 0.25, contentWidth * 0.25];
        const headers = ['Type', 'Nombre', 'Volume', 'Pourcentage'];

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(51, 51, 51);
        let xPos = margin;
        headers.forEach((header, index) => {
          pdf.text(header, xPos + 3, yPosition);
          xPos += colWidths[index];
        });
        yPosition += 8;

        // Calculer le total pour les pourcentages
        const totalVolumeByType = reportData.breakdown.byType.reduce((sum, item) => sum + (item._sum.originalAmount || 0), 0);

        // Données du tableau
        reportData.breakdown.byType.forEach((item, index) => {
          checkPageBreak(10);

          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, yPosition - 6, contentWidth, 8, 'F');
          }

          xPos = margin;
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(51, 51, 51);

          // Type (tronqué si trop long)
          const typeText = item.transactionType.length > 25 ? item.transactionType.substring(0, 22) + '...' : item.transactionType;
          pdf.text(typeText, xPos + 3, yPosition);
          xPos += colWidths[0];

          // Nombre
          pdf.text(formatNumber(item._count.transactionId), xPos + 3, yPosition);
          xPos += colWidths[1];

          // Volume
          pdf.text(formatAmount(item._sum.originalAmount || 0), xPos + 3, yPosition);
          xPos += colWidths[2];

          // Pourcentage
          const percentage = totalVolumeByType > 0 ? ((item._sum.originalAmount || 0) / totalVolumeByType) * 100 : 0;
          pdf.text(`${percentage.toFixed(1)}%`, xPos + 3, yPosition);

          yPosition += 8;
        });

        yPosition += 5;
      }

      // PAGE 5 : TOP TRANSACTIONS
      if (reportData.topTransactions && reportData.topTransactions.length > 0) {
        checkPageBreak(40);
        addSectionTitle('TOP TRANSACTIONS', 18);

        reportData.topTransactions.slice(0, 10).forEach((transaction, index) => {
          checkPageBreak(25);

          // Fond pour chaque transaction
          pdf.setFillColor(index % 2 === 0 ? 250, 250, 250 : 255, 255, 255);
          pdf.rect(margin, yPosition - 8, contentWidth, 20, 'F');

          // Numéro de classement
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 58, 138);
          pdf.text(`#${index + 1}`, margin + 3, yPosition);

          // ID de transaction
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(51, 51, 51);
          pdf.text(`ID: ${transaction.transactionId}`, margin + 15, yPosition);

          // Type et date
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(102, 102, 102);
          pdf.setFontSize(9);
          const txDate = new Date(transaction.transactionInitiatedTime).toLocaleDateString('fr-FR');
          pdf.text(`${transaction.transactionType} - ${txDate}`, margin + 15, yPosition + 5);

          // Montant (aligné à droite)
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 58, 138);
          pdf.text(formatAmount(transaction.originalAmount), pageWidth - margin - 3, yPosition, { align: 'right' });

          // Frais et commission
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(102, 102, 102);
          pdf.text(`Frais: ${formatAmount(transaction.fee)} | Commission: ${formatAmount(transaction.commissionAll)}`, 
            pageWidth - margin - 3, yPosition + 8, { align: 'right' });

          yPosition += 22;
        });
      }

      // PAGE FINALE : CONCLUSIONS
      checkPageBreak(50);
      addSectionTitle('CONCLUSIONS ET RECOMMANDATIONS', 18);

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(51, 51, 51);

      // Section Résumé
      addText('RÉSUMÉ DES PRINCIPAUX INDICATEURS', 12, true);
      yPosition += 3;

      const conclusions = [
        `Volume total des transactions : ${formatAmount(reportData.summary.totalVolume)}`,
        `Nombre total de transactions : ${formatNumber(reportData.summary.totalTransactions)}`,
        `Montant moyen par transaction : ${formatAmount(reportData.summary.averageTransactionAmount)}`,
        `Commissions totales générées : ${formatAmount(reportData.summary.totalCommissions)}`,
        `Frais totaux collectés : ${formatAmount(reportData.summary.totalFees)}`,
      ];

      conclusions.forEach(conclusion => {
        checkPageBreak(10);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(51, 51, 51);
        pdf.text(`• ${conclusion}`, margin + 5, yPosition, { maxWidth: contentWidth - 10 });
        yPosition += 7;
      });

      // Calculs supplémentaires
      yPosition += 5;
      checkPageBreak(15);
      const commissionRatio = reportData.summary.totalVolume > 0 
        ? ((reportData.summary.totalCommissions / reportData.summary.totalVolume) * 100) 
        : 0;
      const feeRatio = reportData.summary.totalVolume > 0 
        ? ((reportData.summary.totalFees / reportData.summary.totalVolume) * 100) 
        : 0;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(102, 102, 102);
      pdf.text(`Ratio commissions/volume : ${commissionRatio.toFixed(2)}%`, margin + 5, yPosition);
      yPosition += 6;
      pdf.text(`Ratio frais/volume : ${feeRatio.toFixed(2)}%`, margin + 5, yPosition);
      yPosition += 10;

      // Section Recommandations
      checkPageBreak(30);
      addSectionTitle('RECOMMANDATIONS', 16);

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(51, 51, 51);

      const recommendations = [
        '1. Analyser les tendances des types de transactions pour identifier les opportunités de croissance',
        '2. Examiner la répartition des commissions pour optimiser la structure des revenus',
        '3. Suivre l\'évolution du montant moyen des transactions pour évaluer la valeur client',
        '4. Comparer les performances avec les périodes précédentes pour mesurer la croissance',
        '5. Identifier les transactions à fort volume pour renforcer les partenariats stratégiques',
      ];

      recommendations.forEach(recommendation => {
        checkPageBreak(10);
        pdf.text(recommendation, margin + 5, yPosition, { maxWidth: contentWidth - 10, align: 'justify' });
        yPosition += 8;
      });

      yPosition += 10;
      checkPageBreak(15);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(150, 150, 150);
      pdf.text('Ce rapport a été généré automatiquement pour faciliter la prise de décision stratégique au sein du conseil d\'administration.', 
        pageWidth / 2, yPosition, { align: 'center', maxWidth: contentWidth });

      // Pied de page sur chaque page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text(`Rapport d'Activité - ${getPeriodLabel()}`, margin, pageHeight - 10);
      }

      // Télécharger le PDF
      const fileName = `rapport-activite-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      alert('Erreur lors de la génération du rapport PDF. Veuillez réessayer.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating}
      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Génération en cours...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-2" />
          Générer Rapport PDF Complet
        </>
      )}
    </Button>
  );
}

