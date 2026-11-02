<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$productos = require 'productos.php';

if (!isset($_SESSION['carrito'])) {
    $_SESSION['carrito'] = []; 
}

function resumenCarrito(array $productos): array
{
    $items = [];
    $total = 0;
    $cantidad = 0;
    foreach ($productos as $p) {
        $id = $p['id'];
        if (!empty($_SESSION['carrito'][$id])) {
            $cant = $_SESSION['carrito'][$id];
            $subtotal = $cant * $p['precio'];
            $items[] = [
                'id'       => $id,
                'nombre'   => $p['nombre'],
                'cantidad' => $cant,
                'subtotal' => round($subtotal, 2),
            ];
            $total += $subtotal;
            $cantidad += $cant;
        }
    }
    return ['items' => $items, 'cantidad' => $cantidad, 'total' => round($total, 2)];
}

$accion = $_REQUEST['accion'] ?? 'listar';
$id = (int) ($_POST['id'] ?? 0);
$existe = in_array($id, array_column($productos, 'id'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($accion === 'agregar' && $existe) {
        $_SESSION['carrito'][$id] = ($_SESSION['carrito'][$id] ?? 0) + 1;
    } elseif ($accion === 'quitar' && isset($_SESSION['carrito'][$id])) {
        $_SESSION['carrito'][$id]--;
        if ($_SESSION['carrito'][$id] <= 0) {
            unset($_SESSION['carrito'][$id]);
        }
    } elseif ($accion === 'vaciar') {
        $_SESSION['carrito'] = [];
    }
}

echo json_encode([
    'productos' => $productos,
    'carrito'   => resumenCarrito($productos),
]);
