<?php

public function calculateFlatTDS(float $base_amount, float $tds_rate, int $qnty): array
{
    // Total amount before TDS
    $total_amount = $base_amount * $qnty;

    // TDS per unit
    $tds_per_unit = $base_amount * ($tds_rate / 100);

    // Total TDS
    $tds_amount = $tds_per_unit * $qnty;

    // Net total payout after TDS
    $gross_amount = $total_amount - $tds_amount;

    return [
        'base_amount'  => $total_amount,   // as per your requirement (total)
        'total_amount' => $total_amount,
        'tds_amount'   => $tds_amount,
        'gross_amount' => $gross_amount
    ];
}