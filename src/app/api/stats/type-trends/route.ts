export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function endOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(23, 59, 59, 999);
	return d;
}

function startOfMonth(date: Date): Date {
	const d = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
	return d;
}

function endOfMonth(date: Date): Date {
	const d = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
	return d;
}

function addDays(date: Date, days: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const period = (searchParams.get('period') || 'day').toLowerCase(); // 'day' | 'month'
		const dateParam = searchParams.get('date'); // ISO string 'YYYY-MM-DD' for day, 'YYYY-MM' for month

		const now = new Date();
		let currentStart: Date;
		let currentEnd: Date;
		let previousStart: Date;
		let previousEnd: Date;

		if (period === 'month') {
			const base = dateParam ? new Date(dateParam + '-01T00:00:00Z') : now;
			currentStart = startOfMonth(base);
			currentEnd = endOfMonth(base);
			const prevMonthStart = startOfMonth(new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1));
			previousStart = prevMonthStart;
			previousEnd = endOfMonth(prevMonthStart);
		} else {
			// day (default)
			const base = dateParam ? new Date(dateParam + 'T00:00:00Z') : now;
			currentStart = startOfDay(base);
			currentEnd = endOfDay(base);
			previousStart = startOfDay(addDays(currentStart, -1));
			previousEnd = endOfDay(addDays(currentEnd, -1));
		}

		const current = await prisma.transaction.groupBy({
			by: ['transactionType'],
			where: {
				transactionInitiatedTime: {
					gte: currentStart,
					lte: currentEnd,
				},
			},
			_count: { transactionId: true },
			_sum: { originalAmount: true, fee: true, commissionAll: true },
			orderBy: { transactionType: 'asc' },
		});

		const previous = await prisma.transaction.groupBy({
			by: ['transactionType'],
			where: {
				transactionInitiatedTime: {
					gte: previousStart,
					lte: previousEnd,
				},
			},
			_count: { transactionId: true },
			_sum: { originalAmount: true, fee: true, commissionAll: true },
			orderBy: { transactionType: 'asc' },
		});

		const prevMap = new Map<string, { count: number; amount: number; fee: number; commission: number }>();
		for (const p of previous) {
			const key = p.transactionType || 'Non spécifié';
			prevMap.set(key, {
				count: p._count.transactionId,
				amount: p._sum.originalAmount || 0,
				fee: p._sum.fee || 0,
				commission: p._sum.commissionAll || 0,
			});
		}

		const trends = current
			.filter(c => c.transactionType && c.transactionType.trim() !== '')
			.map(c => {
				const key = c.transactionType || 'Non spécifié';
				const prev = prevMap.get(key) || { count: 0, amount: 0, fee: 0, commission: 0 };
				const cur = {
					count: c._count.transactionId,
					amount: c._sum.originalAmount || 0,
					fee: c._sum.fee || 0,
					commission: c._sum.commissionAll || 0,
				};

				function deltaPct(curVal: number, prevVal: number): number | null {
					if (prevVal === 0) {
						if (curVal === 0) return 0;
						return 100; // montrer forte hausse quand on passe de 0 à >0
					}
					return ((curVal - prevVal) / prevVal) * 100;
				}

				return {
					transactionType: key,
					current: cur,
					previous: prev,
					deltas: {
						count: cur.count - prev.count,
						amount: cur.amount - prev.amount,
						fee: cur.fee - prev.fee,
						commission: cur.commission - prev.commission,
					},
					percentages: {
						count: deltaPct(cur.count, prev.count),
						amount: deltaPct(cur.amount, prev.amount),
						fee: deltaPct(cur.fee, prev.fee),
						commission: deltaPct(cur.commission, prev.commission),
					},
					trend: {
						count: cur.count === prev.count ? 'flat' : cur.count > prev.count ? 'up' : 'down',
						amount: cur.amount === prev.amount ? 'flat' : cur.amount > prev.amount ? 'up' : 'down',
						fee: cur.fee === prev.fee ? 'flat' : cur.fee > prev.fee ? 'up' : 'down',
						commission: cur.commission === prev.commission ? 'flat' : cur.commission > prev.commission ? 'up' : 'down',
					},
				};
			});

		const summary = trends.reduce(
			(acc, t) => {
				acc.current.count += t.current.count;
				acc.current.amount += t.current.amount;
				acc.current.fee += t.current.fee;
				acc.current.commission += t.current.commission;
				acc.previous.count += t.previous.count;
				acc.previous.amount += t.previous.amount;
				acc.previous.fee += t.previous.fee;
				acc.previous.commission += t.previous.commission;
				return acc;
			},
			{
				current: { count: 0, amount: 0, fee: 0, commission: 0 },
				previous: { count: 0, amount: 0, fee: 0, commission: 0 },
			}
		);

		function pct(curVal: number, prevVal: number): number | null {
			if (prevVal === 0) {
				if (curVal === 0) return 0;
				return 100;
			}
			return ((curVal - prevVal) / prevVal) * 100;
		}

		const summaryPercentages = {
			count: pct(summary.current.count, summary.previous.count),
			amount: pct(summary.current.amount, summary.previous.amount),
			fee: pct(summary.current.fee, summary.previous.fee),
			commission: pct(summary.current.commission, summary.previous.commission),
		};

		return NextResponse.json(
			{
				period,
				currentRange: { start: currentStart.toISOString(), end: currentEnd.toISOString() },
				previousRange: { start: previousStart.toISOString(), end: previousEnd.toISOString() },
				trends,
				summary: {
					...summary,
					percentages: summaryPercentages,
				},
			},
			{ headers: { 'Cache-Control': 'no-store' } }
		);
	} catch (error) {
		console.error('Erreur API tendances par type:', error);
		return NextResponse.json(
			{ error: 'Erreur interne du serveur' },
			{ status: 500 }
		);
	}
}
