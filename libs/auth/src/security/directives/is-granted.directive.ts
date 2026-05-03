/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import {
  computed,
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

import { TriAccessChecker } from '../services/access-checker.service';

@Directive({
  selector: '[triIsGranted]',
})
export class TriIsGrantedDirective {
  private templateRef = inject<TemplateRef<any>>(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private accessChecker = inject(TriAccessChecker);

  /** Tuple of [permission, resource]. Bound via `*triIsGranted="['read', 'users']"`. */
  readonly triIsGranted = input.required<[string, string]>();

  /** Reactive `can` signal — recomputes when binding or current role changes. */
  private readonly granted = computed(() => {
    const [permission, resource] = this.triIsGranted();
    return this.accessChecker.isGranted(permission, resource)();
  });

  private hasView = false;

  constructor() {
    effect(() => {
      const can = this.granted();
      if (can && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!can && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
