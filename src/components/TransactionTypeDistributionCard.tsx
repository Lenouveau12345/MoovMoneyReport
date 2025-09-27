'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2, Download, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TransactionTypeDistributionCardProps {
  period: string;
  customDateRange?: { from?: Date; to?: Date };
}

interface TypeData {
  transactionType: string;
  count: number;
  volume: number;
  fees: number;
  commissions: number;
  percentage: number;
}

export default function TransactionTypeDistributionCard({ period, customDateRange }: TransactionTypeDistributionCardProps) {
  const [data, setData] = useState<TypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchTypeDistribution = async () => {
    try {
      setLoading(true);
      
      // Construire l'URL avec les paramètres de période
      let url = `/api/reports-simple?period=${period}`;
      if (customDateRange?.from && customDateRange?.to) {
        url += `&dateFrom=${customDateRange.from.toISOString()}&dateTo=${customDateRange.to.toISOString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.breakdown?.byType) {
        const totalTransactions = data.summary.totalTransactions;
        
        const typeData = data.breakdown.byType.map((item: any) => ({
          transactionType: item.transactionType || 'Non spécifié',
          count: item._count.transactionId,
          volume: item._sum.originalAmount,
          fees: item._sum.fee,
          commissions: item._sum.commissionAll,
          percentage: totalTransactions > 0 ? (item._count.transactionId / totalTransactions) * 100 : 0
        }));
        
        setData(typeData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la répartition par type:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypeDistribution();
  }, [period, customDateRange]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatAmountForPDF = (amount: number) => {
    // Formatage spécifique pour PDF : utiliser des points comme séparateurs de milliers
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    
    // Remplacer les espaces par des points pour le PDF
    return formatted.replace(/\s/g, '.') + ' F CFA';
  };

  const getTypeColor = (index: number) => {
    const colors = [
      '#3B82F6', // blue-500
      '#10B981', // green-500
      '#8B5CF6', // purple-500
      '#F59E0B', // orange-500
      '#EF4444', // red-500
      '#6366F1', // indigo-500
      '#EC4899', // pink-500
      '#EAB308'  // yellow-500
    ];
    return colors[index % colors.length];
  };

  const getTypeColorClass = (index: number) => {
    const colorClasses = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-yellow-500'
    ];
    return colorClasses[index % colorClasses.length];
  };

  const generatePDF = async () => {
    if (!printRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Créer un canvas avec une configuration optimisée pour éviter les erreurs de couleur
      const canvas = await html2canvas(printRef.current, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: printRef.current.scrollWidth,
        height: printRef.current.scrollHeight,
        ignoreElements: (element) => {
          // Ignorer les éléments qui pourraient causer des problèmes
          return element.classList.contains('no-print');
        },
        onclone: (clonedDoc) => {
          // Simplifier les styles dans le clone pour éviter les erreurs de couleur
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              color: #000000 !important;
              background-color: transparent !important;
            }
            .bg-orange-500 { background-color: #f97316 !important; }
            .bg-blue-500 { background-color: #3b82f6 !important; }
            .bg-green-500 { background-color: #10b981 !important; }
            .bg-purple-500 { background-color: #8b5cf6 !important; }
            .bg-red-500 { background-color: #ef4444 !important; }
            .bg-indigo-500 { background-color: #6366f1 !important; }
            .bg-pink-500 { background-color: #ec4899 !important; }
            .bg-yellow-500 { background-color: #eab308 !important; }
            .text-white { color: #ffffff !important; }
            .text-gray-900 { color: #111827 !important; }
            .text-gray-700 { color: #374151 !important; }
            .text-gray-600 { color: #4b5563 !important; }
            .text-gray-500 { color: #6b7280 !important; }
            .border-gray-300 { border-color: #d1d5db !important; }
            .bg-gray-50 { background-color: #f9fafb !important; }
            .bg-white { background-color: #ffffff !important; }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Créer un PDF en mode paysage
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Calculer les dimensions pour ajuster l'image au format paysage
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Ajouter le titre
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Rapport - Répartition par Type de Transaction', pdfWidth / 2, 20, { align: 'center' });
      
      // Ajouter la période
      const periodText = period === 'day' ? 'Aujourd\'hui' :
                        period === 'week' ? 'Cette semaine' :
                        period === 'month' ? 'Ce mois' :
                        period === 'year' ? 'Cette année' :
                        'Période personnalisée';
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Période: ${periodText}`, pdfWidth / 2, 30, { align: 'center' });
      
      if (customDateRange?.from && customDateRange?.to) {
        pdf.text(`Du ${customDateRange.from.toLocaleDateString('fr-FR')} au ${customDateRange.to.toLocaleDateString('fr-FR')}`, pdfWidth / 2, 35, { align: 'center' });
      }

      // Ajouter l'image
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Ajouter la date de génération
      pdf.setFontSize(10);
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });

      // Télécharger le PDF
      const fileName = `rapport-repartition-transactions-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      
      // Fallback: générer un PDF simple avec les données textuelles
      try {
        await generateSimplePDF();
      } catch (fallbackError) {
        console.error('Erreur lors de la génération du PDF de fallback:', fallbackError);
        alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generateSimplePDF = async () => {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Dessiner une bordure générale autour du document
    pdf.setDrawColor(100, 100, 100);
    pdf.setLineWidth(0.5);
    pdf.rect(10, 10, pdfWidth - 20, pdfHeight - 20);
    
    // En-tête avec fond
    pdf.setFillColor(245, 245, 245);
    pdf.rect(15, 15, pdfWidth - 30, 25, 'F');
    
    // Titre
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Rapport - Répartition par Type de Transaction', pdfWidth / 2, 25, { align: 'center' });
    
    // Période
    const periodText = period === 'day' ? 'Aujourd\'hui' :
                      period === 'week' ? 'Cette semaine' :
                      period === 'month' ? 'Ce mois' :
                      period === 'year' ? 'Cette année' :
                      'Période personnalisée';
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Période: ${periodText}`, pdfWidth / 2, 32, { align: 'center' });
    
    if (customDateRange?.from && customDateRange?.to) {
      pdf.text(`Du ${customDateRange.from.toLocaleDateString('fr-FR')} au ${customDateRange.to.toLocaleDateString('fr-FR')}`, pdfWidth / 2, 37, { align: 'center' });
    }
    
    // Ligne de séparation
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, 42, pdfWidth - 15, 42);

    // Tableau des données avec grille
    let yPosition = 50;
    const colWidth = pdfWidth / 4;
    const startX = 20;
    const endX = pdfWidth - 20;
    
    // Dessiner la grille du tableau
    const drawTableGrid = (startY: number, endY: number) => {
      // Bordures verticales
      for (let i = 0; i <= 4; i++) {
        const x = startX + (i * colWidth);
        pdf.line(x, startY, x, endY);
      }
      
      // Bordures horizontales
      pdf.line(startX, startY, endX, startY);
      pdf.line(startX, endY, endX, endY);
    };
    
    // En-têtes du tableau avec fond gris
    pdf.setFillColor(240, 240, 240);
    pdf.rect(startX, yPosition - 8, endX - startX, 10, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Type de Transaction', startX + 5, yPosition);
    pdf.text('Nombre', startX + colWidth + 5, yPosition);
    pdf.text('Volume (XOF)', startX + colWidth * 2 + 5, yPosition);
    pdf.text('Pourcentage', startX + colWidth * 3 + 5, yPosition);
    
    const headerEndY = yPosition + 2;
    yPosition += 10;
    
    // Dessiner la grille pour les en-têtes
    drawTableGrid(headerEndY - 10, headerEndY);
    
    // Données avec grille
    pdf.setFont('helvetica', 'normal');
    data.forEach((item, index) => {
      if (yPosition > pdfHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      
      const rowStartY = yPosition - 6;
      const rowEndY = yPosition + 2;
      
      // Alterner les couleurs de fond pour les lignes
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(startX, rowStartY, endX - startX, 8, 'F');
      }
      
      // Dessiner la grille pour cette ligne
      drawTableGrid(rowStartY, rowEndY);
      
      // Ajouter le contenu
      pdf.text(item.transactionType, startX + 5, yPosition);
      pdf.text(item.count.toString(), startX + colWidth + 5, yPosition);
      pdf.text(formatAmountForPDF(item.volume), startX + colWidth * 2 + 5, yPosition);
      pdf.text(`${item.percentage.toFixed(1)}%`, startX + colWidth * 3 + 5, yPosition);
      
      yPosition += 8;
    });
    
    // Statistiques résumées avec grille
    yPosition += 15;
    
    // Titre de la section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Statistiques Résumées', pdfWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    // Créer une grille 2x2 pour les statistiques
    const statsWidth = (endX - startX) / 2;
    const statsHeight = 25;
    const statsData = [
      { label: 'Total Transactions', value: data.reduce((sum, item) => sum + item.count, 0).toString() },
      { label: 'Total Volume', value: formatAmountForPDF(data.reduce((sum, item) => sum + item.volume, 0)) },
      { label: 'Total Frais', value: formatAmountForPDF(data.reduce((sum, item) => sum + item.fees, 0)) },
      { label: 'Total Commissions', value: formatAmountForPDF(data.reduce((sum, item) => sum + item.commissions, 0)) }
    ];
    
    statsData.forEach((stat, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = startX + (col * statsWidth);
      const y = yPosition + (row * statsHeight);
      
      // Dessiner le cadre de la statistique
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(x, y, statsWidth, statsHeight);
      
      // Fond alterné
      if (index % 2 === 0) {
        pdf.setFillColor(248, 248, 248);
        pdf.rect(x, y, statsWidth, statsHeight, 'F');
      }
      
      // Ajouter le contenu
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(stat.label, x + 5, y + 8);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(stat.value, x + 5, y + 18);
    });
    
    yPosition += (Math.ceil(statsData.length / 2) * statsHeight) + 10;
    
    // Date de génération
    pdf.setFontSize(8);
    pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });

    // Télécharger le PDF
    const fileName = `rapport-repartition-transactions-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  if (loading) {
    return (
      <Card className="border border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Répartition par Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-xl bg-white">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Répartition par Type de Transaction
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Analyse détaillée des transactions par catégorie
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF || data.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exporter PDF
                </>
              )}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune donnée disponible pour cette période</p>
          </div>
        ) : (
          <div ref={printRef} className="space-y-8">
            {/* Section principale avec graphique et légende */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Graphique en camembert professionnel avec zoom */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
                <div className="relative w-96 h-96 mb-6 group">
                  <div className={`transition-all duration-500 ease-in-out ${
                    hoveredSegment !== null ? 'scale-125' : 'scale-100'
                  }`}>
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
                      {data.map((item, index) => {
                        const startAngle = data.slice(0, index).reduce((sum, d) => sum + (d.percentage * 3.6), 0);
                        const endAngle = startAngle + (item.percentage * 3.6);
                        const largeArcFlag = item.percentage > 50 ? 1 : 0;
                        
                        // Calculer les coordonnées pour un rayon plus grand
                        const x1 = 50 + 45 * Math.cos((startAngle * Math.PI) / 180);
                        const y1 = 50 + 45 * Math.sin((startAngle * Math.PI) / 180);
                        const x2 = 50 + 45 * Math.cos((endAngle * Math.PI) / 180);
                        const y2 = 50 + 45 * Math.sin((endAngle * Math.PI) / 180);
                        
                        const pathData = [
                          `M 50 50`,
                          `L ${x1} ${y1}`,
                          `A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          'Z'
                        ].join(' ');
                        
                        const isHovered = hoveredSegment === index;
                        const isOtherHovered = hoveredSegment !== null && hoveredSegment !== index;
                        
                        return (
                          <g key={item.transactionType}>
                            <path
                              d={pathData}
                              fill={getTypeColor(index)}
                              className={`transition-all duration-300 cursor-pointer drop-shadow-sm ${
                                isHovered 
                                  ? 'opacity-100 brightness-110' 
                                  : isOtherHovered 
                                    ? 'opacity-50 brightness-75' 
                                    : 'opacity-90 hover:opacity-100'
                              }`}
                              stroke="white"
                              strokeWidth={isHovered ? "2" : "1"}
                              onMouseEnter={() => setHoveredSegment(index)}
                              onMouseLeave={() => setHoveredSegment(null)}
                              style={{
                                transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                                transformOrigin: '50% 50%',
                                filter: isHovered ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))' : 'none'
                              }}
                            />
                            {/* Texte du pourcentage à l'intérieur */}
                            {item.percentage > 5 && (
                              <text
                                x={50 + 30 * Math.cos(((startAngle + endAngle) / 2) * Math.PI / 180)}
                                y={50 + 30 * Math.sin(((startAngle + endAngle) / 2) * Math.PI / 180)}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className={`font-bold transition-all duration-300 ${
                                  isHovered ? 'fill-white' : 'fill-white'
                                }`}
                                style={{ 
                                  fontSize: isHovered ? '5px' : '4px',
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                                  fontWeight: isHovered ? '900' : 'bold'
                                }}
                              >
                                {item.percentage.toFixed(1)}%
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  {/* Centre du camembert avec le total */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`text-center bg-white rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-white transition-all duration-300 ${
                      hoveredSegment !== null ? 'w-36 h-36' : 'w-28 h-28'
                    }`}>
                      <div className={`font-bold text-gray-900 transition-all duration-300 ${
                        hoveredSegment !== null ? 'text-4xl' : 'text-2xl'
                      }`}>
                        {data.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
                      </div>
                      <div className={`font-medium text-gray-600 transition-all duration-300 ${
                        hoveredSegment !== null ? 'text-lg' : 'text-sm'
                      }`}>
                        Transactions
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Répartition des Transactions</h3>
                  <p className="text-sm text-gray-600">Total de {data.length} types de transactions</p>
                </div>
              </div>
              
              {/* Légende professionnelle */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-gray-900">Détail par Type</h4>
                  <div className="text-sm text-gray-500">
                    {data.length} types de transactions
                  </div>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.map((item, index) => {
                    const isHovered = hoveredSegment === index;
                    const isOtherHovered = hoveredSegment !== null && hoveredSegment !== index;
                    
                    return (
                      <div 
                        key={item.transactionType} 
                        className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                          isHovered 
                            ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 shadow-xl scale-110' 
                            : isOtherHovered
                              ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 opacity-60'
                              : 'bg-gradient-to-r from-gray-50 to-white border-gray-200 hover:shadow-md hover:scale-105'
                        }`}
                        onMouseEnter={() => setHoveredSegment(index)}
                        onMouseLeave={() => setHoveredSegment(null)}
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className={`rounded-full shadow-sm transition-all duration-300 ${
                              isHovered ? 'w-8 h-8 shadow-xl' : 'w-5 h-5'
                            } ${getTypeColorClass(index)}`}
                          ></div>
                          <div>
                            <span className={`font-semibold transition-all duration-300 ${
                              isHovered 
                                ? 'text-orange-900 text-lg' 
                                : 'text-gray-900 text-sm group-hover:text-gray-700'
                            }`}>
                              {item.transactionType}
                            </span>
                            <div className={`transition-all duration-300 ${
                              isHovered ? 'text-orange-700 text-base' : 'text-gray-500 text-xs'
                            }`}>
                              {item.count.toLocaleString()} transactions
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold transition-all duration-300 ${
                            isHovered 
                              ? 'text-orange-900 text-2xl' 
                              : 'text-gray-900 text-lg'
                          }`}>
                            {item.percentage.toFixed(1)}%
                          </div>
                          <div className={`transition-all duration-300 ${
                            isHovered ? 'text-orange-700 text-base' : 'text-gray-500 text-xs'
                          }`}>
                            {formatAmount(item.volume)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Statistiques résumées professionnelles */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-6 text-center">Statistiques Résumées</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 text-center shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {data.length}
                  </p>
                  <p className="text-sm font-medium text-gray-600">Types de Transactions</p>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="w-6 h-6 text-green-600 font-bold">#</div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {data.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
                  </p>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="w-6 h-6 text-orange-600 font-bold">₣</div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {formatAmount(data.reduce((sum, item) => sum + item.fees, 0))}
                  </p>
                  <p className="text-sm font-medium text-gray-600">Total Frais</p>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="w-6 h-6 text-purple-600 font-bold">%</div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {formatAmount(data.reduce((sum, item) => sum + item.commissions, 0))}
                  </p>
                  <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
