"use client";

import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UnitPickerModal } from "@/components/billing/unit-picker";
import { BillingSaleModeTabs } from "@/components/billing/billing-sale-mode-tabs";
import { BillingProductPanel } from "@/components/billing/billing-product-panel";
import { BillingCartPanel } from "@/components/billing/billing-cart-panel";
import { MobileCartBar } from "@/components/billing/mobile-cart-bar";
import { CheckoutSheet } from "@/components/billing/checkout-sheet";
import { useBillingPage } from "@/hooks/use-billing-page";
import { useGlobalBarcodeScanner } from "@/hooks/use-global-barcode-scanner";

export default function BillingPage() {
  const b = useBillingPage();

  // Enable global physical barcode scanner listening on the entire billing page
  useGlobalBarcodeScanner(b.handleBarcodeScanned, !b.showScanner);

  const cartDispatch = {
    setBillingMode: (mode: Parameters<typeof b.setBillingMode>[0]) => b.dispatch(b.setBillingMode(mode)),
    setDiscount: (n: number) => b.dispatch(b.setDiscount(n)),
    setTaxEnabled: (v: boolean) => b.dispatch(b.setTaxEnabled(v)),
    setTaxRate: (n: number) => b.dispatch(b.setTaxRate(n)),
    setTaxMode: (m: Parameters<typeof b.setTaxMode>[0]) => b.dispatch(b.setTaxMode(m)),
    setPaymentMethod: (m: Parameters<typeof b.setPaymentMethod>[0]) => b.dispatch(b.setPaymentMethod(m)),
    setCreditSale: (v: boolean) => b.dispatch(b.setCreditSale(v)),
    setAmountReceived: (n: number) => b.dispatch(b.setAmountReceived(n)),
    setGenerateGstInvoice: (v: boolean) => b.dispatch(b.setGenerateGstInvoice(v)),
    setPaymentAmount: (p: Parameters<typeof b.setPaymentAmount>[0]) => b.dispatch(b.setPaymentAmount(p)),
    selectCustomer: (c: Parameters<typeof b.selectCustomer>[0]) => b.dispatch(b.selectCustomer(c)),
    updateQty: (p: Parameters<typeof b.updateQty>[0]) => b.dispatch(b.updateQty(p)),
    updateLinePrice: (p: Parameters<typeof b.updateLinePrice>[0]) => b.dispatch(b.updateLinePrice(p)),
    removeItem: (id: string) => b.dispatch(b.removeItem(id)),
    clearBill: () => b.dispatch(b.clearBill()),
  };

  const sharedCartProps = {
    billing: b.billing,
    isWholesale: b.isWholesale,
    isKhataPayment: b.isKhataPayment,
    showCustomerSection: b.showCustomerSection,
    hasCreditKhata: b.hasCreditKhata,
    hasGstInvoices: b.hasGstInvoices,
    paymentMethods: b.paymentMethods,
    token: b.token,
    outletId: b.outletId,
    subtotal: b.subtotal,
    taxAmount: b.taxAmount,
    total: b.total,
    amountDuePreview: b.amountDuePreview,
    cartTotals: b.cartTotals,
    cgst: b.cgst,
    sgst: b.sgst,
    igst: b.igst,
    isInterState: b.isInterState,
    settings: b.settings,
    editingPriceId: b.editingPriceId,
    editPriceValue: b.editPriceValue,
    showSuccess: b.showSuccess,
    outletMissing: !b.outletId,
    submitPending: b.submitOrder.isPending,
    submitError: b.submitOrder.error,
    dispatch: cartDispatch,
    setEditingPriceId: b.setEditingPriceId,
    setEditPriceValue: b.setEditPriceValue,
    onCheckout: b.handleCheckout,
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">
      <BillingSaleModeTabs
        showSaleModeTabs={b.showSaleModeTabs}
        wholesaleOnly={b.wholesaleOnly}
        isWholesale={b.isWholesale}
        taxEnabled={b.billing.taxEnabled}
        taxMode={b.billing.taxMode}
        onSaleModeChange={b.handleSaleModeChange}
      />

      <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-hidden lg:flex-row p-2">
        <BillingProductPanel
          search={b.search}
          onSearchChange={b.setSearch}
          onSearchEnter={() => b.handleBarcodeScanned(b.search.trim())}
          onOpenScanner={() => b.setShowScanner(true)}
          catScrollRef={b.catScrollRef}
          topCategories={b.topCategories}
          categories={b.categories}
          selectedCategoryId={b.selectedCategoryId}
          selectedParentId={b.selectedParentId}
          onSelectCategory={(id, parentId) => {
            b.setSelectedCategoryId(id);
            b.setSelectedParentId(parentId);
          }}
          activeSubcategories={b.activeSubcategories}
          onSubcategorySelect={b.setSelectedCategoryId}
          scrollCategoryLeft={b.scrollCategoryLeft}
          scrollCategoryRight={b.scrollCategoryRight}
          prodIsRefetching={b.prodIsRefetching}
          prodCooldownSeconds={b.prodCooldownSeconds}
          onRefetch={b.handleProdRefetch}
          products={b.products}
          productsFetching={b.productsFetching}
          prodMeta={b.prodMeta}
          prodPage={b.prodPage}
          prodLimit={b.prodLimit}
          onPageChange={b.setProdPage}
          onPageSizeChange={b.setProdLimit}
          cartItems={b.billing.items}
          isWholesale={b.isWholesale}
          onAddProduct={b.handleAddProduct}
        />

        <div className="hidden min-h-0 w-80 shrink-0 flex-col overflow-hidden xl:w-96 lg:flex">
          <BillingCartPanel variant="desktop" {...sharedCartProps} />
        </div>
      </div>

      <MobileCartBar
        itemCount={b.cartItemCount}
        total={b.total}
        hidden={b.showCheckout}
        onOpenCheckout={() => b.setShowCheckout(true)}
      />

      <CheckoutSheet
        open={b.showCheckout}
        onOpenChange={b.setShowCheckout}
        {...sharedCartProps}
      />

      <BarcodeScanner
        open={b.showScanner}
        onClose={() => b.setShowScanner(false)}
        onScan={b.handleBarcodeScanned}
        continuous={true}
      />

      <UnitPickerModal
        open={Boolean(b.unitPickProduct)}
        product={b.unitPickProduct}
        onClose={() => b.setUnitPickProduct(null)}
        onConfirm={(option, qty) => {
          if (b.unitPickProduct) b.addProductToCart(b.unitPickProduct, option, qty);
        }}
      />

      <ConfirmDialog
        open={b.pendingSaleMode !== null}
        onClose={() => b.setPendingSaleMode(null)}
        onConfirm={() => {
          if (b.pendingSaleMode) b.dispatch(b.setSaleMode(b.pendingSaleMode));
          b.setPendingSaleMode(null);
        }}
        title="Switch billing mode?"
        message="Your current cart will be cleared when switching between Retail and Wholesale."
        confirmLabel="Switch & clear cart"
        variant="warning"
      />
    </div>
  );
}
