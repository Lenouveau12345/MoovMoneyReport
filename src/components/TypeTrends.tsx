"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Calendar, RefreshCcw, TrendingUp } from "lucide-react";

type Period = "day" | "month";

interface TrendMetrics {
	count: number;
	amount: number;
	fee: number;
	commission: number;
}

interface TypeTrendItem {
	transactionType: string;
	current: TrendMetrics;
	previous: TrendMetrics;
	deltas: TrendMetrics;
	percentages: {
		count: number | null;
		amount: number | null;
		fee: number | null;
		commission: number | null;
	};
	trend: {
		count: "up" | "down" | "flat";
		amount: "up" | "down" | "flat";
		fee: "up" | "down" | "flat";
		commission: "up" | "down" | "flat";
	};
}

interface ApiResponse {
	period: Period;
	currentRange: { start: string; end: string };
	previousRange: { start: string; end: string };
	trends: TypeTrendItem[];
	summary: {
		current: TrendMetrics;
		previous: TrendMetrics;
		percentages: {
			count: number | null;
			amount: number | null;
			fee: number | null;
			commission: number | null;
		};
	};
}

function formatAmount(x: number) {
	return new Intl.NumberFormat("fr-FR", {
		style: "currency",
		currency: "XOF",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(x || 0);
}

function formatNumber(x: number) {
	return new Intl.NumberFormat("fr-FR").format(x || 0);
}

function MiniTrendIcon({ value }: { value: number | null }) {
	if (value === null || value === 0) {
		return <ArrowRight className="w-4 h-4 text-gray-400" />;
	}
	if (value > 0) {
		return <ArrowUpRight className="w-4 h-4 text-orange-600" title={`+${value.toFixed(1)}%`} />;
	}
	return <ArrowDownRight className="w-4 h-4 text-black" title={`${value.toFixed(1)}%`} />;
}

export default function TypeTrends() {
	const [period, setPeriod] = useState<Period>("day");
	const [date, setDate] = useState<string>(() => {
		const d = new Date();
		return d.toISOString().slice(0, 10); // YYYY-MM-DD
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<ApiResponse | null>(null);

	const dateInputType = period === "month" ? "month" : "date";
	const dateParam = useMemo(() => (period === "month" ? date.slice(0, 7) : date), [period, date]);

	async function fetchData() {
		try {
			setLoading(true);
			const ts = Date.now();
			const res = await fetch(`/api/stats/type-trends?period=${period}&date=${encodeURIComponent(dateParam)}&t=${ts}`, {
				cache: "no-store",
				headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json: ApiResponse = await res.json();
			setData(json);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erreur inconnue");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [period, dateParam]);

	return (
		<Card className="border-0 shadow-lg">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUp className="w-5 h-5 text-orange-600" />
					Tendances par Type de Transaction
				</CardTitle>
				<CardDescription>
					Comparer {period === "day" ? "la journée" : "le mois"} sélectionné(e) au précédent
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Controls */}
				<div className="flex flex-col md:flex-row gap-3 md:items-center">
					<div className="flex gap-2">
						<button onClick={() => setPeriod("day")} className={`px-3 py-1 rounded ${period === "day" ? "bg-orange-600 text-white" : "bg-gray-100"}`}>Jour</button>
						<button onClick={() => setPeriod("month")} className={`px-3 py-1 rounded ${period === "month" ? "bg-orange-600 text-white" : "bg-gray-100"}`}>Mois</button>
					</div>
					<div className="flex items-center gap-2">
						<Calendar className="w-4 h-4 text-gray-600" />
						<input type={dateInputType as any} value={period === "month" ? date.slice(0, 7) : date} onChange={(e) => setDate(e.target.value)} className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500" />
					</div>
					<button onClick={fetchData} className="inline-flex items-center gap-2 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">
						<RefreshCcw className="w-4 h-4" /> Rafraîchir
					</button>
				</div>

				{loading && (
					<div className="text-center py-8 text-gray-500">Chargement des tendances...</div>
				)}
				{error && (
					<div className="text-center py-8 text-red-600">Erreur: {error}</div>
				)}
				{!loading && !error && data && (
					<div className="space-y-6">
						{/* Summary */}
						<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
							<div className="bg-orange-50 rounded p-3">
								<p className="text-sm text-orange-700">Transactions</p>
								<div className="flex items-center justify-between">
									<p className="text-xl font-semibold">{formatNumber(data.summary.current.count)}</p>
									<MiniTrendIcon value={data.summary.percentages.count} />
								</div>
							</div>
							<div className="bg-white rounded p-3 border border-gray-200">
								<p className="text-sm text-gray-700">Montant</p>
								<div className="flex items-center justify-between">
									<p className="text-xl font-semibold">{formatAmount(data.summary.current.amount)}</p>
									<MiniTrendIcon value={data.summary.percentages.amount} />
								</div>
							</div>
							<div className="bg-white rounded p-3 border border-gray-200">
								<p className="text-sm text-gray-700">Frais</p>
								<div className="flex items-center justify-between">
									<p className="text-xl font-semibold">{formatAmount(data.summary.current.fee)}</p>
									<MiniTrendIcon value={data.summary.percentages.fee} />
								</div>
							</div>
							<div className="bg-white rounded p-3 border border-gray-200">
								<p className="text-sm text-gray-700">Commissions</p>
								<div className="flex items-center justify-between">
									<p className="text-xl font-semibold">{formatAmount(data.summary.current.commission)}</p>
									<MiniTrendIcon value={data.summary.percentages.commission} />
								</div>
							</div>
						</div>

						{/* List per type */}
						<div className="space-y-3">
							{data.trends.map((t) => (
								<div key={t.transactionType} className="p-3 bg-white border border-gray-200 rounded-lg">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-semibold text-gray-900">{t.transactionType}</p>
											<p className="text-xs text-gray-600">{formatNumber(t.current.count)} tx</p>
										</div>
										<div className="flex items-center gap-4">
											<div className="text-right">
												<p className="text-xs text-gray-500">Montant</p>
												<div className="flex items-center gap-2 justify-end">
													<p className="font-medium">{formatAmount(t.current.amount)}</p>
													<MiniTrendIcon value={t.percentages.amount} />
												</div>
											</div>
											<div className="text-right">
												<p className="text-xs text-gray-500">Frais</p>
												<div className="flex items-center gap-2 justify-end">
													<p className="font-medium">{formatAmount(t.current.fee)}</p>
													<MiniTrendIcon value={t.percentages.fee} />
												</div>
											</div>
											<div className="text-right">
												<p className="text-xs text-gray-500">Commissions</p>
												<div className="flex items-center gap-2 justify-end">
													<p className="font-medium">{formatAmount(t.current.commission)}</p>
													<MiniTrendIcon value={t.percentages.commission} />
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
