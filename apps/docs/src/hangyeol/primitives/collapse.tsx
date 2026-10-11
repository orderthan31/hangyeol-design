import * as Primitive from '@radix-ui/react-collapsible';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '../lib/cn';
export const Collapse=Primitive.Root;
export const CollapseTrigger=forwardRef<ElementRef<typeof Primitive.Trigger>,ComponentPropsWithoutRef<typeof Primitive.Trigger>>(function CollapseTrigger({className,...props},ref){return <Primitive.Trigger {...props} ref={ref} className={cn('inline-flex border-0 bg-transparent min-h-11 items-center gap-2 rounded-g-control px-3 py-2 text-g-small font-medium hover:bg-g-muted focus-visible:outline-3 focus-visible:outline-g-focus disabled:opacity-50',className)}/>;});
export const CollapseContent=forwardRef<ElementRef<typeof Primitive.Content>,ComponentPropsWithoutRef<typeof Primitive.Content>>(function CollapseContent({className,...props},ref){return <Primitive.Content {...props} ref={ref} className={cn('grid min-w-0 gap-3 break-words py-3 text-g-small text-g-soft',className)}/>;});
