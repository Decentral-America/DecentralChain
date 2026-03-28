/**
 * Component List Utility
 * Dynamic component registry and loader for React
 */

import {
  type ComponentType,
  createElement,
  type LazyExoticComponent,
  lazy,
  type ReactNode,
  Suspense,
} from 'react';
import { logger } from '@/lib/logger';

/**
 * Component metadata
 */
export interface ComponentMetadata {
  /**
   * Component unique ID
   */
  id: string;

  /**
   * Component display name
   */
  name: string;

  /**
   * Component category
   */
  category: string;

  /**
   * Component description
   */
  description?: string;

  /**
   * Component tags for filtering
   */
  tags?: string[];

  /**
   * Component props type
   */
  props?: Record<string, unknown>;

  /**
   * Whether component is lazy-loaded
   */
  lazy?: boolean;

  /**
   * Loading fallback component
   */
  fallback?: ReactNode;
}

/**
 * Registered component entry
 */
export interface ComponentEntry<P = unknown> {
  /**
   * Component metadata
   */
  metadata: ComponentMetadata;

  /**
   * Component reference (eager or lazy)
   */
  component: ComponentType<P> | LazyExoticComponent<ComponentType<P>>;

  /**
   * Registration timestamp
   */
  timestamp: number;
}

/**
 * Component list events
 */
export type ComponentListEvent = 'add' | 'remove' | 'update';

/**
 * Component list event handler
 */
export type ComponentListHandler = (entry: ComponentEntry) => void;

/**
 * Component list class for managing dynamic components
 */
class ComponentListManager {
  /**
   * Component registry
   */
  private components: Map<string, ComponentEntry> = new Map();

  /**
   * Category index
   */
  private categories: Map<string, Set<string>> = new Map();

  /**
   * Tag index
   */
  private tags: Map<string, Set<string>> = new Map();

  /**
   * Event handlers
   */
  private handlers: Map<ComponentListEvent, Set<ComponentListHandler>> = new Map([
    ['add', new Set()],
    ['remove', new Set()],
    ['update', new Set()],
  ]);

  /**
   * Get component count
   */
  get length(): number {
    return this.components.size;
  }

  /**
   * Get all component IDs
   */
  get ids(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Get all categories
   */
  get allCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Get all tags
   */
  get allTags(): string[] {
    return Array.from(this.tags.keys());
  }

  /**
   * Register a component
   * @param metadata - Component metadata
   * @param component - Component reference
   */
  register<P = unknown>(
    metadata: ComponentMetadata,
    component: ComponentType<P> | LazyExoticComponent<ComponentType<P>>,
  ): void {
    const entry: ComponentEntry<P> = {
      component,
      metadata,
      timestamp: Date.now(),
    };

    // Update component registry
    this.components.set(metadata.id, entry as ComponentEntry);

    // Update category index
    if (!this.categories.has(metadata.category)) {
      this.categories.set(metadata.category, new Set());
    }
    this.categories.get(metadata.category)?.add(metadata.id);

    // Update tag index
    if (metadata.tags) {
      for (const tag of metadata.tags) {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag)?.add(metadata.id);
      }
    }

    // Emit event
    this.emit('add', entry as ComponentEntry);

    logger.debug(`Component registered: ${metadata.id} (${metadata.name})`);
  }

  /**
   * Unregister a component
   * @param id - Component ID
   * @returns Success status
   */
  unregister(id: string): boolean {
    const entry = this.components.get(id);
    if (!entry) {
      logger.warn(`Component not found: ${id}`);
      return false;
    }

    // Remove from component registry
    this.components.delete(id);

    // Remove from category index
    const categorySet = this.categories.get(entry.metadata.category);
    if (categorySet) {
      categorySet.delete(id);
      if (categorySet.size === 0) {
        this.categories.delete(entry.metadata.category);
      }
    }

    // Remove from tag index
    if (entry.metadata.tags) {
      for (const tag of entry.metadata.tags) {
        const tagSet = this.tags.get(tag);
        if (tagSet) {
          tagSet.delete(id);
          if (tagSet.size === 0) {
            this.tags.delete(tag);
          }
        }
      }
    }

    // Emit event
    this.emit('remove', entry);

    logger.debug(`Component unregistered: ${id}`);
    return true;
  }

  /**
   * Get component by ID
   * @param id - Component ID
   * @returns Component entry or undefined
   */
  get(id: string): ComponentEntry | undefined {
    return this.components.get(id);
  }

  /**
   * Get component reference
   * @param id - Component ID
   * @returns Component reference or null
   */
  getComponent<P = unknown>(
    id: string,
  ): ComponentType<P> | LazyExoticComponent<ComponentType<P>> | null {
    const entry = this.components.get(id);
    return entry
      ? (entry.component as ComponentType<P> | LazyExoticComponent<ComponentType<P>>)
      : null;
  }

  /**
   * Check if component exists
   * @param id - Component ID
   * @returns True if exists
   */
  has(id: string): boolean {
    return this.components.has(id);
  }

  /**
   * Get all components
   * @returns Array of component entries
   */
  getAll(): ComponentEntry[] {
    return Array.from(this.components.values());
  }

  /**
   * Get components by category
   * @param category - Category name
   * @returns Array of component entries
   */
  getByCategory(category: string): ComponentEntry[] {
    const ids = this.categories.get(category);
    if (!ids) return [];

    return Array.from(ids)
      .map((id) => this.components.get(id))
      .filter((entry): entry is ComponentEntry => entry !== undefined);
  }

  /**
   * Get components by tag
   * @param tag - Tag name
   * @returns Array of component entries
   */
  getByTag(tag: string): ComponentEntry[] {
    const ids = this.tags.get(tag);
    if (!ids) return [];

    return Array.from(ids)
      .map((id) => this.components.get(id))
      .filter((entry): entry is ComponentEntry => entry !== undefined);
  }

  /**
   * Filter components
   * @param predicate - Filter function
   * @returns Array of component entries
   */
  filter(predicate: (entry: ComponentEntry) => boolean): ComponentEntry[] {
    return Array.from(this.components.values()).filter(predicate);
  }

  /**
   * Find component
   * @param predicate - Search function
   * @returns Component entry or undefined
   */
  find(predicate: (entry: ComponentEntry) => boolean): ComponentEntry | undefined {
    return Array.from(this.components.values()).find(predicate);
  }

  /**
   * Check if any component matches
   * @param predicate - Test function
   * @returns True if any matches
   */
  some(predicate: (entry: ComponentEntry) => boolean): boolean {
    return Array.from(this.components.values()).some(predicate);
  }

  /**
   * Check if all components match
   * @param predicate - Test function
   * @returns True if all match
   */
  every(predicate: (entry: ComponentEntry) => boolean): boolean {
    return Array.from(this.components.values()).every(predicate);
  }

  /**
   * Iterate over components
   * @param callback - Iteration callback
   */
  forEach(callback: (entry: ComponentEntry) => void): void {
    this.components.forEach(callback);
  }

  /**
   * Map components
   * @param callback - Map callback
   * @returns Array of mapped values
   */
  map<T>(callback: (entry: ComponentEntry) => T): T[] {
    return Array.from(this.components.values()).map(callback);
  }

  /**
   * Clear all components
   */
  clear(): void {
    this.components.clear();
    this.categories.clear();
    this.tags.clear();
    logger.debug('All components cleared');
  }

  /**
   * Subscribe to events
   * @param event - Event type
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  on(event: ComponentListEvent, handler: ComponentListHandler): () => void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.add(handler);
    }

    return () => {
      handlers?.delete(handler);
    };
  }

  /**
   * Subscribe to event once
   * @param event - Event type
   * @param handler - Event handler
   */
  once(event: ComponentListEvent, handler: ComponentListHandler): void {
    const wrappedHandler = (entry: ComponentEntry) => {
      handler(entry);
      this.handlers.get(event)?.delete(wrappedHandler);
    };
    this.on(event, wrappedHandler);
  }

  /**
   * Emit event
   * @param event - Event type
   * @param entry - Component entry
   */
  private emit(event: ComponentListEvent, entry: ComponentEntry): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(entry);
        } catch (error) {
          logger.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Get statistics
   * @returns Component statistics
   */
  getStats(): {
    total: number;
    categories: Record<string, number>;
    tags: Record<string, number>;
    lazy: number;
  } {
    const stats = {
      categories: {} as Record<string, number>,
      lazy: 0,
      tags: {} as Record<string, number>,
      total: this.components.size,
    };

    this.categories.forEach((ids, category) => {
      stats.categories[category] = ids.size;
    });

    this.tags.forEach((ids, tag) => {
      stats.tags[tag] = ids.size;
    });

    this.components.forEach((entry) => {
      if (entry.metadata.lazy) {
        stats.lazy++;
      }
    });

    return stats;
  }
}

/**
 * Create lazy component with fallback
 * @param importer - Component importer
 * @param fallback - Loading fallback
 * @returns Wrapped lazy component
 */
export const createLazyComponent = <P = unknown>(
  importer: () => Promise<{ default: ComponentType<P> }>,
  _fallback?: ReactNode,
): LazyExoticComponent<ComponentType<P>> => {
  return lazy(importer);
};

/**
 * Render component with suspense
 * @param Component - Component to render
 * @param props - Component props
 * @param fallback - Loading fallback
 * @returns React element
 */
export const renderWithSuspense = <P = unknown>(
  Component: ComponentType<P> | LazyExoticComponent<ComponentType<P>>,
  props: P,
  fallback?: ReactNode,
): ReactNode => {
  return createElement(
    Suspense,
    { fallback: fallback ?? createElement('div', null, 'Loading...') },
    createElement(
      Component as ComponentType<Record<string, unknown>>,
      props as Record<string, unknown>,
    ),
  );
};

/**
 * Global component list instance
 */
export const componentList = new ComponentListManager();

/**
 * Export class for custom instances
 */
export { ComponentListManager };

// Types already exported above
