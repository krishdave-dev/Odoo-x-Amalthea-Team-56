"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function CreateSalesOrderPage() {
	const lines = [
		{ product: "P1", qty: 10, unit: "Kg", price: 15, tax: "15%", amount: 172.5 },
		{ product: "P1", qty: 10, unit: "Litre", price: 20, tax: "15%", amount: 230.0 },
	];

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="rounded-lg border p-6 min-h-[520px]">
				{/* Action buttons */}
				<div className="flex items-center gap-3 mb-4">
					<button className="px-4 py-2 rounded-md border bg-transparent text-sm hover:bg-neutral-800">Create Invoice</button>
					<button className="px-4 py-2 rounded-md border bg-transparent text-sm hover:bg-neutral-800">Confirm</button>
					<button className="px-4 py-2 rounded-md border bg-transparent text-sm hover:bg-neutral-800">Cancel</button>
				</div>

				<hr className="border-neutral-700 mb-4" />

				{/* Order header */}
				<div className="mb-6">
					<h2 className="text-2xl font-semibold">S001</h2>
					<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="text-sm text-muted-foreground block mb-2">Customer</label>
							<input className="w-full bg-transparent border-b py-2 px-2 text-lg" placeholder="Select customer" />
						</div>

						<div>
							<label className="text-sm text-muted-foreground block mb-2">Project</label>
							<input className="w-full bg-transparent border-b py-2 px-2 text-lg" placeholder="Select project" />
						</div>
					</div>
				</div>

				<hr className="border-neutral-700 my-4" />

				{/* Order lines */}
				<div className="mb-4">
					<h3 className="text-lg font-medium mb-3">Order Lines</h3>

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Product</TableHead>
								<TableHead>Quantity</TableHead>
								<TableHead>Unit</TableHead>
								<TableHead>Unit Price</TableHead>
								<TableHead>Taxes</TableHead>
								<TableHead>Amount</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{lines.map((l, idx) => (
								<TableRow key={idx}>
									<TableCell>{l.product}</TableCell>
									<TableCell>{l.qty}</TableCell>
									<TableCell>{l.unit}</TableCell>
									<TableCell>{l.price}</TableCell>
									<TableCell>
										<Badge variant="outline">{l.tax}</Badge>
									</TableCell>
									<TableCell>{l.amount.toFixed(2)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					<div className="mt-4">
						<button className="text-red-400 font-medium">Add a product</button>
					</div>
				</div>

				{/* Totals area aligned right */}
				<div className="flex justify-end mt-6">
					<div className="w-64 text-right">
						<div className="mb-2">
							<span className="block text-sm text-muted-foreground">UnTaxed Amount:</span>
							<span className="text-lg font-semibold">$402.50</span>
						</div>
						<div>
							<span className="block text-sm text-muted-foreground">Total:</span>
							<span className="text-lg font-semibold">$463.38</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
