"use client";

import TypeTrends from "@/components/TypeTrends";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function TendancesPage() {
	return (
		<div className="p-6 space-y-6">
			<Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-xl">
						<TrendingUp className="w-5 h-5" />
						Tendances par Type
					</CardTitle>
					<CardDescription>
						Comparer une journée ou un mois à la période précédente et visualiser la tendance par type
					</CardDescription>
				</CardHeader>
			</Card>

			<TypeTrends />
		</div>
	);
}
