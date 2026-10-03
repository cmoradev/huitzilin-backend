import { Logger } from '@nestjs/common';
import { addDays, endOfDay } from 'date-fns';
import Decimal from 'decimal.js';
import { request, RequestOptions } from 'https';
import {
  calculateAmount,
  calculateSubtotalAndDiscount,
  calculateTotalFromBaseAndTax,
  TaxEnum,
} from 'src/common/lib/calculations';
import { Discount } from 'src/miscellaneous';
import { Debit } from 'src/school';
import { DebitState } from 'src/school/debit/enums';
import {
  CreateConceptInput,
  CreateConceptInputWithDebit,
} from '../concept/dto/create-concept.input';
import { Concept } from '../concept/entities/concept.entity';
import { CreateConceptPayload } from '../concept/types';
import { CreatePaymentInput } from '../payment/dto/create-payment.input';
import { Income } from './entities/income.entity';
import { IncomeState } from './enum';
import {
  ConceptMetadata,
  CreateIncomePayload,
  LinkClipResponse,
} from './types';
import { ConceptApplication } from '../concept/enum';

export const groupByBranchId = (concepts: CreateConceptPayload[]) => {
  const map = new Map<string, CreateConceptPayload[]>();

  concepts.forEach((concept) => {
    const branchId = concept.branchID;
    if (!map.has(branchId)) {
      map.set(branchId, []);
    }
    map.get(branchId)?.push(concept);
  });

  return map;
};

export const matchConceptWithDebit = (
  concepts: CreateConceptInput[],
  debits: Debit[],
): CreateConceptInputWithDebit[] => {
  return concepts.map((concept) => {
    const debit = debits.find((d) => d.id === concept.debitId) || null;

    return { ...concept, debit };
  });
};

export const applyCalculationsInConcepts = (
  concepts: CreateConceptInputWithDebit[],
  allDiscounts: Discount[],
): CreateConceptPayload[] => {
  return concepts.map((concept) => {
    const { unitPrice, quantity, amount } = calculateAmount(
      concept.unitPrice,
      concept.quantity,
    );

    // TODO: Aplicar varias veces el mismo descuento
    // Posiblemente no acepte varios descuentos con el mismo ID
    // Optimiza la búsqueda de descuentos usando un Set para O(1) lookups
    const discountIdsSet = new Set(concept.discounts.map((c) => c.id));
    const discounts = allDiscounts.filter((d) => discountIdsSet.has(d.id));

    const { discount, subtotal } = calculateSubtotalAndDiscount(
      amount,
      discounts,
    );

    const { taxes, total } = calculateTotalFromBaseAndTax(
      subtotal,
      concept.withTax ? TaxEnum.Sixteen : TaxEnum.Zero,
    );

    return {
      branchID: concept.branchID,
      withTax: concept.withTax,
      description: concept.description,
      amount,
      unitPrice,
      quantity,
      subtotal,
      discount,
      taxes,
      total,
      application: concept.application,
      pendingPayment: total,
      paymentDate: null,
      state: DebitState.DEBT,
      dueDate: new Date(concept.debit?.dueDate ?? new Date()),
      debitId: concept.debitId,
      discounts: discounts.map((d) => ({
        id: d.id,
      })),
    };
  });
};

export const applyPaymentsInConcepts = (
  details: CreateConceptPayload[],
  payments: CreatePaymentInput[],
) => {
  const currentDetails = [...details].sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
  );
  const currentPayments = [...payments].sort((a, b) => b.amount - a.amount);
  let received = currentPayments.reduce(
    (acc, payment) => acc.plus(payment.amount),
    new Decimal(0),
  );

  return currentDetails.map((concept) => {
    let decimalPending = new Decimal(concept.pendingPayment);
    let paymentDate: Date | null = null;
    let state: DebitState | null = null;

    if (received.greaterThan(0)) {
      const paidAmount = Decimal.min(received, decimalPending);
      received = received.minus(paidAmount);
      decimalPending = decimalPending.minus(paidAmount);
      if (concept.application === ConceptApplication.DEBT_PAYMENT) {
        paymentDate = new Date();
        state = decimalPending.abs().lessThanOrEqualTo(0.5)
          ? DebitState.PAID
          : DebitState.PARTIALLY_PAID;
      }
    }

    return {
      ...concept,
      pendingPayment: decimalPending.toNumber(),
      paymentDate,
      state,
    };
  });
};

export const applyClipPaymentInConcepts = (
  concepts: ConceptMetadata[],
  payment: CreatePaymentInput,
) => {
  const currentDetails = [...concepts].sort(
    (a, b) => a.debitDueDate.getTime() - b.debitDueDate.getTime(),
  );

  let received = new Decimal(payment.amount);

  currentDetails.forEach((concept) => {
    const total = new Decimal(concept.conceptPendingPayment);

    if (received.greaterThan(0)) {
      const paidAmount = Decimal.min(received, total);
      received = received.minus(paidAmount);

      const pendingPayment = total.minus(paidAmount);

      concept.conceptPendingPayment = pendingPayment.toNumber();
      if (concept.conceptApplication === ConceptApplication.DEBT_PAYMENT) {
        concept.debitPaymentDate = new Date();
        concept.debitState = pendingPayment.abs().lessThanOrEqualTo(0.01)
          ? DebitState.PAID
          : DebitState.PARTIALLY_PAID;
      } else {
        concept.debitId = null;
      }
    }
  });

  return currentDetails;
};

export const buildBreakdown = (details: CreateConceptPayload[]) => {
  const initial = {
    amount: new Decimal(0),
    discount: new Decimal(0),
    subtotal: new Decimal(0),
    taxes: new Decimal(0),
    total: new Decimal(0),
    pendingPayment: new Decimal(0),
  };

  const { amount, discount, subtotal, taxes, total, pendingPayment } =
    details.reduce(
      (acc, curr) => ({
        amount: acc.amount.plus(curr.amount),
        discount: acc.discount.plus(curr.discount),
        subtotal: acc.subtotal.plus(curr.subtotal),
        taxes: acc.taxes.plus(curr.taxes),
        total: acc.total.plus(curr.total),
        pendingPayment: acc.pendingPayment.plus(curr.pendingPayment),
      }),
      initial,
    );

  return {
    amount: Number(amount.toFixed(6)),
    discount: Number(discount.toFixed(6)),
    subtotal: Number(subtotal.toFixed(6)),
    taxes: Number(taxes.toFixed(6)),
    total: Number(total.toFixed(6)),
    pendingPayment: Number(pendingPayment.toFixed(6)),
  };
};

export const buildIncomesWithoutPayments = (
  concepts: CreateConceptPayload[],
  branchId: string,
  studentIds: string[],
): Omit<CreateIncomePayload, 'payments'> => {
  const { amount, discount, subtotal, taxes, total, pendingPayment } =
    buildBreakdown(concepts);

  return {
    amount,
    discount,
    subtotal,
    taxes,
    total,
    pendingPayment,
    state: IncomeState.PENDING,
    branchId,
    studentIds,
    concepts,
  };
};

export const buildIncomesWithPayments = (
  concepts: CreateConceptPayload[],
  payments: CreatePaymentInput[],
  studentIds: string[],
  branchId: string,
) => {
  const { amount, discount, subtotal, taxes, total, pendingPayment } =
    buildBreakdown(concepts);

  let currentPayments = [...payments].sort((a, b) => b.amount - a.amount);

  const { adjustedPayments, remainingPayments } = distributePayments(
    total,
    currentPayments,
  );

  const state = new Decimal(pendingPayment).abs().lessThanOrEqualTo(0.01)
    ? IncomeState.PAID
    : IncomeState.PENDING;

  const income: CreateIncomePayload = {
    amount,
    discount,
    subtotal,
    taxes,
    total,
    pendingPayment,
    studentIds,
    branchId,
    payments: adjustedPayments,
    state,
    concepts,
  };

  currentPayments = remainingPayments;

  return { income, remainingPayments };
};

export const distributePayments = (
  total: number,
  payments: CreatePaymentInput[],
) => {
  let totalDecimal = new Decimal(total);
  // Crear copia de los pagos para no mutar el original
  let remainingPayments = [...payments].sort((a, b) => b.amount - a.amount);

  const adjustedPayments: CreatePaymentInput[] = [];

  remainingPayments.forEach((payment) => {
    const paymentDecimal = new Decimal(payment.amount);

    if (totalDecimal.greaterThanOrEqualTo(paymentDecimal)) {
      adjustedPayments.push({ ...payment });
      totalDecimal = totalDecimal.minus(paymentDecimal);
      payment.amount = 0; // Marcar como pagado
    } else if (paymentDecimal.greaterThanOrEqualTo(totalDecimal)) {
      // Si el pago es mayor que lo que falta por pagar, ajustar el pago
      adjustedPayments.push({
        ...payment,
        amount: totalDecimal.toNumber(),
      });
      payment.amount = paymentDecimal.minus(totalDecimal).toNumber();
    }
  });

  remainingPayments = remainingPayments.filter((payment) =>
    new Decimal(payment.amount).greaterThan(0),
  );

  return {
    adjustedPayments,
    remainingPayments,
  };
};

// TODO: Posiblemente mejorar la lógica de pago
export const prepareConceptWithDebit = (
  concepts: Concept[],
): ConceptMetadata[] => {
  return concepts.map((concept) => {
    const { id, pendingPayment, debits, application } = concept;

    const debit = debits.find(() => true);

    return {
      conceptId: id,
      conceptPendingPayment: pendingPayment,
      conceptApplication: application,
      debitId: debit?.id || null,
      debitPaymentDate: new Date(),
      debitState: DebitState.DEBT,
      debitDueDate: new Date(debit?.dueDate ?? new Date()),
    };
  });
};

export const applyClipPaymentInIncome = (
  income: Income,
  payment: CreatePaymentInput,
) => {
  let pendingPayment = new Decimal(income.pendingPayment);
  const received = new Decimal(payment.amount);

  pendingPayment = pendingPayment.minus(received);

  income.pendingPayment = pendingPayment.toNumber();
  income.state = pendingPayment.abs().lessThanOrEqualTo(0.01)
    ? IncomeState.PAID
    : IncomeState.PENDING;

  return income;
};

export const applyPaymentsInIncome = (
  income: Income,
  payments: CreatePaymentInput[],
) => {
  let pendingPayment = new Decimal(income.pendingPayment);

  const received = payments.reduce(
    (acc, payment) => acc.plus(payment.amount),
    new Decimal(0),
  );

  pendingPayment = pendingPayment.minus(received);

  income.pendingPayment = pendingPayment.toNumber();
  income.state = pendingPayment.abs().lessThanOrEqualTo(0.01)
    ? IncomeState.PAID
    : IncomeState.PENDING;

  return income;
};

export const generatePurchaseDescription = (concepts: Concept[]): string => {
  const lines = concepts.map((c) => `~ ${c.description}`);

  return `${lines.join(' | ')}`;
};

export const conceptToCreateConceptMap = (
  concepts: Concept[],
  branchID: string,
) => {
  return concepts
    .filter((concept) => new Decimal(concept.pendingPayment).greaterThan(0))
    .map((concept) => {
      const debit = concept.debits.find(() => true);

      return {
        id: concept.id,
        description: concept.description,
        unitPrice: concept.unitPrice,
        quantity: concept.quantity,
        amount: concept.amount,
        discount: concept.discount,
        subtotal: concept.subtotal,
        taxes: concept.taxes,
        total: concept.total,
        application: concept.application,
        pendingPayment: concept.pendingPayment,
        withTax: concept.withTax,
        discounts: concept.discounts,
        debitId: debit?.id || null,
        state: debit?.state || null,
        paymentDate: new Date(),
        dueDate: new Date(),
        branchID,
      };
    });
};
