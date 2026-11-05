import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import type { ApiModule } from './common/module/api-module.js';
import { EventsModule } from './events/events.module.js';
import { FeedbacksModule } from './feedbacks/feedbacks.module.js';
import { UsersModule } from './users/users.module.js';

// Module racine : instancie et relie les modules de l'application.
export class AppModule {
  private readonly usersModule = new UsersModule();
  private readonly feedbacksModule = new FeedbacksModule(this.usersModule);
  private readonly eventsModule = new EventsModule(this.usersModule, this.feedbacksModule);
  private readonly authModule = new AuthModule(this.usersModule);
  private readonly adminModule = new AdminModule(this.usersModule);

  readonly modules: readonly ApiModule[] = [
    this.authModule,
    this.usersModule,
    this.adminModule,
    this.eventsModule,
    this.feedbacksModule,
  ];
}
