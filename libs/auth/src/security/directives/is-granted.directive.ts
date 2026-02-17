import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import {
  DestroyRef,
  Directive,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TriAccessChecker } from '../services/access-checker.service';

@Directive({
  selector: '[triIsGranted]',
  inputs: ['isGranted:triIsGranted'],
})
export class TriIsGrantedDirective {
  private templateRef = inject<TemplateRef<any>>(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private accessChecker = inject(TriAccessChecker);

  private destroyRef = inject(DestroyRef);

  private hasView = false;

  set isGranted([permission, resource]: [string, string]) {
    this.accessChecker
      .isGranted(permission, resource)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((can: boolean) => {
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
