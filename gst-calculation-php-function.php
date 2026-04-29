<?php

public function calculateFinalPriceWithGst($basePrice, $gstPercent, $taxType = 'intra')
	{
		$basePrice = (float) $basePrice;
		$gstPercent = (float) $gstPercent;

		$totalTaxAmount = ($basePrice * $gstPercent) / 100;
		$finalPrice = $basePrice + $totalTaxAmount;

		$cgstAmount = 0;
		$sgstAmount = 0;
		$igstAmount = 0;

		if ($taxType === 'intra') {
			$cgstAmount = $totalTaxAmount / 2;
			$sgstAmount = $totalTaxAmount / 2;
		} else {
			$igstAmount = $totalTaxAmount;
		}

		return [
			'base_price'  => round($basePrice, 2),
			'gst_percent' => $gstPercent,
			'gst_amount'  => round($totalTaxAmount, 2),
			'cgst_amount' => round($cgstAmount, 2),
			'sgst_amount' => round($sgstAmount, 2),
			'igst_amount' => round($igstAmount, 2),
			'final_price' => round($finalPrice, 2),
		];
	}
	