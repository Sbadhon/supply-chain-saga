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
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-shipping-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './shipping-create-modal.component.html',
  styleUrls: ['./shipping-create-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShippingCreateModalComponent {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submittedShipment = new EventEmitter<{
    order_id: string;
    label_url?: string;
  }>();
  form!: FormGroup;
  submitted = signal(false);

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      order_id: ['', [Validators.required]],
      label_url: [''],
    });
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.open) this.close();
  }

  onBackdrop(): void {
    this.close();
  }

  close(): void {
    this.submitted.set(false);
    this.form.reset({ order_id: '', label_url: '' });
    this.closed.emit();
  }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;

    const v = this.form.value;
    this.submittedShipment.emit({
      order_id: String(v.order_id || '').trim(),
      label_url: (v.label_url || '').trim() || undefined,
    });

    this.close();
  }
}
