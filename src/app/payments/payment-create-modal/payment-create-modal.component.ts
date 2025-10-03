import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-payment-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './payment-create-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentCreateModalComponent {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submittedPayment = new EventEmitter<{
    orderId: string;
    amount: number;
    currency: string;
    method?: string;
  }>();

  submitted = signal(false);
  form!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      orderId: ['', [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0)]],
      currency: ['USD', [Validators.required]],
      method: [''],
    });
  }

  @HostListener('document:keydown.escape') onEsc() {
    if (this.open) this.close();
  }
  onBackdrop(): void {
    this.close();
  }

  close(): void {
    this.submitted.set(false);
    this.form.reset({ orderId: '', amount: 0, currency: 'USD', method: '' });
    this.closed.emit();
  }

  submit() {
    this.submitted.set(true);
    if (this.form.invalid) return;

    const v = this.form.value;
    this.submittedPayment.emit({
      orderId: String(v.orderId || '').trim(),
      amount: Number(v.amount ?? 0),
      currency: String(v.currency || 'USD')
        .trim()
        .toUpperCase(),
      method: (v.method || '').trim() || undefined,
    });

    this.close();
  }
}
