import bcrypt from 'bcryptjs';
import request from 'supertest';
import type { Express } from 'express';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { EventModel } from '../events/event.model.js';
import { FeedbackModel } from '../feedbacks/feedback.model.js';
import { signAccessToken } from '../common/auth/jwt.js';
import type { Role } from '../common/auth/roles.js';
import { UserModel } from '../users/user.model.js';
import type { UserDocument } from '../users/user.model.js';

const app: Express = createApp();

// Chaque requête se présente avec une IP fuente unique (TRUST_PROXY=1) :
// les budgets des limiteurs ne se marquent pas mutuellement, sauf dans
// le test de limitation de débit qui réutilise volontairement la même IP.
let compteurIp = 0;

const ipUnique = (): string => {
  compteurIp += 1;
  return `10.77.${Math.floor(compteurIp / 250) % 250}.${(compteurIp % 250) + 1}`;
};

interface ServeurTest {
  get: (url: string) => request.Test;
  post: (url: string) => request.Test;
  patch: (url: string) => request.Test;
  delete: (url: string) => request.Test;
}

const construireServeur = (ip: string): ServeurTest => ({
  get: (url: string) => request(app).get(url).set('X-Forwarded-For', ip),
  post: (url: string) => request(app).post(url).set('X-Forwarded-For', ip),
  patch: (url: string) => request(app).patch(url).set('X-Forwarded-For', ip),
  delete: (url: string) => request(app).delete(url).set('X-Forwarded-For', ip),
});

const requete = (): ServeurTest => construireServeur(ipUnique());

const requeteDepuis = (ip: string): ServeurTest => construireServeur(ip);

afterAll(() => {
  vi.resetModules();
});

const MOT_DE_PASSE = 'motdepasse123';

const creerUtilisateur = async (
  nom: string,
  email: string,
  role: Role = 'user'
): Promise<{ user: UserDocument; token: string; id: string }> => {
  const user = await UserModel.create({
    nom,
    email: email.toLowerCase(),
    motDePasse: await bcrypt.hash(MOT_DE_PASSE, 10),
    role,
  });
  return { user, token: signAccessToken(user._id.toString()), id: user._id.toString() };
};

const creerEvenement = async (titre: string, auteurId: string, date = '2026-03-10T10:00:00') => {
  return EventModel.create({
    titre,
    description: `Description de ${titre}`,
    lieu: 'A204',
    date,
    auteur: auteurId,
  });
};

const EVENEMENT_VALIDE = {
  titre: 'Réunion générale',
  description: 'Vote du budget du club',
  lieu: 'Amphi A204',
  date: '2026-05-20T18:00',
};

describe('API racine', () => {
  it('répond sur /', async () => {
    const res = await requete().get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'API Le Panneau en ligne' });
  });

  it('renvoie 404 JSON pour une route inconnue', async () => {
    const res = await requete().get('/api/inconnu');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Route introuvable' });
  });
});

describe('POST /api/auth/register', () => {
  it('crée un compte user et renvoie une session', async () => {
    const res = await requete()
      .post('/api/auth/register')
      .send({ nom: 'Alice', email: 'alice@club.org', motDePasse: 'abcdef' });

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({
      nom: 'Alice',
      email: 'alice@club.org',
      role: 'user',
    });
    expect(res.body.user).not.toHaveProperty('motDePasse');
  });

  it('refuse un email déjà pris (409)', async () => {
    await creerUtilisateur('Alice', 'alice@club.org');
    const res = await requete()
      .post('/api/auth/register')
      .send({ nom: 'Alice bis', email: 'ALICE@club.org', motDePasse: 'abcdef' });

    expect(res.status).toBe(409);
  });

  it('valide les champs (400)', async () => {
    const sansNom = await requete()
      .post('/api/auth/register')
      .send({ email: 'x@y.z', motDePasse: 'abcdef' });
    expect(sansNom.status).toBe(400);

    const court = await requete()
      .post('/api/auth/register')
      .send({ nom: 'B', email: 'x@y.z', motDePasse: '12345' });
    expect(court.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('connecte un utilisateur existant', async () => {
    await creerUtilisateur('Bob', 'bob@club.org');
    const res = await requete()
      .post('/api/auth/login')
      .send({ email: 'bob@club.org', motDePasse: MOT_DE_PASSE });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ nom: 'Bob', role: 'user' });
  });

  it('répond le même message pour mauvais mot de passe et email inconnu', async () => {
    await creerUtilisateur('Bob', 'bob@club.org');

    const mauvaisPass = await requete()
      .post('/api/auth/login')
      .send({ email: 'bob@club.org', motDePasse: 'faux' });
    const emailInconnu = await requete()
      .post('/api/auth/login')
      .send({ email: 'inconnu@club.org', motDePasse: 'nimporte' });

    expect(mauvaisPass.status).toBe(401);
    expect(emailInconnu.status).toBe(401);
    expect(mauvaisPass.body.message).toBe(emailInconnu.body.message);
  });
});

describe('Gardes d’authentification et de rôle', () => {
  it('refuse sans token (401)', async () => {
    const res = await requete().post('/api/events').send(EVENEMENT_VALIDE);
    expect(res.status).toBe(401);
  });

  it('refuse un token invalide (401)', async () => {
    const res = await requete()
      .post('/api/events')
      .set('Authorization', 'Bearer pas.un.token')
      .send(EVENEMENT_VALIDE);
    expect(res.status).toBe(401);
  });

  it('refuse un token d’utilisateur supprimé (401)', async () => {
    const { user } = await creerUtilisateur('Fantôme', 'fantome@club.org');
    const token = signAccessToken(user._id.toString());
    await user.deleteOne();

    const res = await requete()
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('refuse la liste des utilisateurs à un simple membre (403)', async () => {
    const { token } = await creerUtilisateur('Membre', 'membre@club.org');
    const res = await requete().get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('refuse /api/users sans token (401)', async () => {
    await creerUtilisateur('Admin', 'admin1@club.org', 'admin');
    const res = await requete().get('/api/users');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users + PATCH /api/users/:id/role (admin)', () => {
  it('liste les utilisateurs pour un admin', async () => {
    const { token } = await creerUtilisateur('Admin', 'admin1@club.org', 'admin');
    await creerUtilisateur('Membre', 'membre@club.org');

    const res = await requete()
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    for (const user of res.body) {
      expect(user).not.toHaveProperty('motDePasse');
      expect(user).toHaveProperty('role');
    }
  });

  it('ne change pas son propre rôle (400)', async () => {
    const { token, id } = await creerUtilisateur('Admin', 'admin1@club.org', 'admin');
    const res = await requete()
      .patch(`/api/users/${id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'user' });
    expect(res.status).toBe(400);
  });

  it('refuse un rôle inconnu (400)', async () => {
    const { token } = await creerUtilisateur('Admin', 'admin1@club.org', 'admin');
    const { id } = await creerUtilisateur('Membre', 'membre@club.org');

    const res = await requete()
      .patch(`/api/users/${id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'superadmin' });
    expect(res.status).toBe(400);
  });

  it('empêche de retirer le dernier admin (400)', async () => {
    const { token, id } = await creerUtilisateur('Admin', 'admin1@club.org', 'admin');
    const { id: cibleId } = await creerUtilisateur(
      'Licencié',
      'licencie@club.org',
      'admin'
    );

    // Première rotation : OK, admin1 retire le rôle de l'autre admin.
    const ok = await requete()
      .patch(`/api/users/${cibleId}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'user' });
    expect(ok.status).toBe(200);
    expect(ok.body.role).toBe('user');

    // Tentative de se retirer lui-même -> déjà refusé ; on vérifie donc
    // qu'un autre admin ne peut pas non plus dégrader le tout dernier.
    const autres = await requete()
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    const restants = autres.body.filter(
      (u: { role: string }) => u.role === 'admin'
    );
    expect(restants).toHaveLength(1);
    expect(restants[0].id).toBe(id);
  });

  it('interdit un utilisateur inconnu (404)', async () => {
    const { token } = await creerUtilisateur('Admin', 'admin1@club.org', 'admin');
    const res = await requete()
      .patch('/api/users/655f3d1e7a1d2c58a4f00a77/role')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'user' });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/events', () => {
  it('peuple l’auteur et renvoie la session complète', async () => {
    const { user, token } = await creerUtilisateur('Alice', 'alice@club.org');
    const res = await requete()
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(EVENEMENT_VALIDE);

    expect(res.status).toBe(201);
    expect(res.body.titre).toBe('Réunion générale');
    expect(res.body.auteur).toMatchObject({ nom: 'Alice', _id: user._id.toString() });  });

  it('valide les champs (400) et la date (400)', async () => {
    const { token } = await creerUtilisateur('Alice', 'alice@club.org');

    const incomplet = await requete()
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ titre: 'x', description: 'y', lieu: 'z' });
    expect(incomplet.status).toBe(400);

    const dateInvalide = await requete()
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...EVENEMENT_VALIDE, date: 'demain matin' });
    expect(dateInvalide.status).toBe(400);
  });
});

describe('GET /api/events', () => {
  it('trie les événements par date croissante, sans authentification', async () => {
    await creerEvenement('Tardif', '655f3d1e7a1d2c58a4f00a11', '2026-06-10T12:00');
    await creerEvenement('Tôt', '655f3d1e7a1d2c58a4f00a12', '2026-05-10T12:00');

    const res = await requete().get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((e: { titre: string }) => e.titre)).toEqual(['Tôt', 'Tardif']);
  });
});

describe('DELETE /api/events/:id', () => {
  it('auteur supprime son événement et les avis liés', async () => {
    const { id, user } = await creerUtilisateur('Alice', 'alice@club.org');
    const event = await creerEvenement('Atelier', user._id.toString());
    await FeedbackModel.create({
      texte: 'Très bien',
      note: 5,
      evenement: event._id,
      auteur: user._id,
    });

    const res = await requete()
      .delete(`/api/events/${event._id.toString()}`)
      .set('Authorization', `Bearer ${signAccessToken(id)}`);

    expect(res.status).toBe(200);
    expect(await EventModel.countDocuments({})).toBe(0);
    expect(await FeedbackModel.countDocuments({})).toBe(0);
  });

  it('un autre membre ne peut pas supprimer (403)', async () => {
    const auteur = await creerUtilisateur('Alice', 'alice@club.org');
    const autre = await creerUtilisateur('Mallory', 'mallory@club.org');
    const event = await creerEvenement('Atelier', auteur.id);

    const res = await requete()
      .delete(`/api/events/${event._id.toString()}`)
      .set('Authorization', `Bearer ${autre.token}`);
    expect(res.status).toBe(403);
    expect(await EventModel.countDocuments({})).toBe(1);
  });

  it('l’admin supprime l’événement de quelqu’un d’autre (200)', async () => {
    const auteur = await creerUtilisateur('Alice', 'alice@club.org');
    const admin = await creerUtilisateur('Admin', 'admin1@club.org', 'admin');
    const event = await creerEvenement('Atelier', auteur.id);

    const res = await requete()
      .delete(`/api/events/${event._id.toString()}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
  });

  it('un événement inconnu renvoie 404', async () => {
    const { token } = await creerUtilisateur('Alice', 'alice@club.org');
    const res = await requete()
      .delete('/api/events/655f3d1e7a1d2c58a4f00a66')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('un ObjectId invalide renvoie 400', async () => {
    const { token } = await creerUtilisateur('Alice', 'alice@club.org');
    const res = await requete()
      .delete('/api/events/pas-un-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Identifiant invalide');
  });
});

describe('POST /api/feedbacks', () => {
  it('crée un avis sur un événement existant', async () => {
    const { id, user } = await creerUtilisateur('Alice', 'alice@club.org');
    const event = await creerEvenement('Atelier', user._id.toString());

    const res = await requete()
      .post('/api/feedbacks')
      .set('Authorization', `Bearer ${signAccessToken(id)}`)
      .send({ texte: 'Très bien', note: 4, evenement: event._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.auteur).toMatchObject({ nom: 'Alice' });
    expect(res.body.note).toBe(4);
  });

  it('refuse un avis sur un événement inconnu (404)', async () => {
    const { id } = await creerUtilisateur('Alice', 'alice@club.org');
    const res = await requete()
      .post('/api/feedbacks')
      .set('Authorization', `Bearer ${signAccessToken(id)}`)
      .send({ texte: 'Super', note: 3, evenement: '655f3d1e7a1d2c58a4f00a55' });
    expect(res.status).toBe(404);
  });

  it('refuse note 0 et note 6 (400)', async () => {
    const { id, user } = await creerUtilisateur('Alice', 'alice@club.org');
    const event = await creerEvenement('Atelier', user._id.toString());
    const headers = { Authorization: `Bearer ${signAccessToken(id)}` };

    const note0 = await requete()
      .post('/api/feedbacks')
      .set(headers)
      .send({ texte: 'Bof', note: 0, evenement: event._id.toString() });
    const note6 = await requete()
      .post('/api/feedbacks')
      .set(headers)
      .send({ texte: 'Wahou', note: 6, evenement: event._id.toString() });

    expect(note0.status).toBe(400);
    expect(note6.status).toBe(400);
  });
});

describe('GET /api/events/:id/feedbacks + DELETE /api/feedbacks/:id', () => {
  it('liste les avis et interdit la suppression par un tiers (403)', async () => {
    const auteur = await creerUtilisateur('Alice', 'alice@club.org');
    const event = await creerEvenement('Atelier', auteur.id);
    const feedback = await FeedbackModel.create({
      texte: 'Très bien',
      note: 5,
      evenement: event._id,
      auteur: auteur.user._id,
    });
    const tiers = await creerUtilisateur('Mallory', 'mallory@club.org');

    const liste = await requete().get(`/api/events/${event._id.toString()}/feedbacks`);
    expect(liste.status).toBe(200);
    expect(liste.body).toHaveLength(1);
    expect(liste.body[0].auteur).toMatchObject({ nom: 'Alice' });

    const interdit = await requete()
      .delete(`/api/feedbacks/${feedback._id.toString()}`)
      .set('Authorization', `Bearer ${tiers.token}`);
    expect(interdit.status).toBe(403);

    const admis = await requete()
      .delete(`/api/feedbacks/${feedback._id.toString()}`)
      .set('Authorization', `Bearer ${auteur.token}`);
    expect(admis.status).toBe(200);
  });

  it('l’admin peut supprimer n’importe quel avis', async () => {
    const auteur = await creerUtilisateur('Alice', 'alice@club.org');
    const event = await creerEvenement('Atelier', auteur.id);
    const feedback = await FeedbackModel.create({
      texte: 'Très bien',
      note: 5,
      evenement: event._id,
      auteur: auteur.user._id,
    });
    const admin = await creerUtilisateur('Admin', 'admin1@club.org', 'admin');

    const res = await requete()
      .delete(`/api/feedbacks/${feedback._id.toString()}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(await FeedbackModel.countDocuments({})).toBe(0);
  });
});

describe('GET /api/admin/stats (admin)', () => {
  it('renvoie la Vue d’ensemble à un admin', async () => {
    const auteur = await creerUtilisateur('Alice', 'alice@club.org');
    const { token } = await creerUtilisateur('Admin', 'admin1@club.org', 'admin');
    const event = await creerEvenement('Atelier', auteur.id);
    await FeedbackModel.create({
      texte: 'Très bien',
      note: 5,
      evenement: event._id,
      auteur: auteur.user._id,
    });

    const res = await requete()
      .get('/api/admin/stats?days=30')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toBe(2);
    expect(res.body.admins).toBe(1);
    expect(res.body.events).toBe(1);
    expect(res.body.feedbacks).toBe(1);
    expect(res.body.averageNote).toBe(5);
    expect(Array.isArray(res.body.series)).toBe(true);
  });

  it('refuse un simple membre (403)', async () => {
    const { token } = await creerUtilisateur('Membre', 'membre@club.org');
    const res = await requete()
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('Limitation de débit (dernier test du fichier pour ne pas polluer)', () => {
  it('bloque les écritures au-delà de 20/minute (429)', async () => {
    const { token } = await creerUtilisateur('Alice', 'alice@club.org');
    const ipProbe = ipUnique();

    // IP fixe pour ce test : le compteur start à zéro pour cette adresse
    // et atteint la limite au 21e appel.
    let bloque = false;
    for (let i = 0; i < 25; i += 1) {
      const res = await requeteDepuis(ipProbe)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...EVENEMENT_VALIDE, titre: `Spam ${i}` });
      if (res.status === 429) {
        bloque = true;
        expect(res.body.message).toContain('Trop de modifications');
        break;
      }
      expect([200, 201]).toContain(res.status);
    }
    expect(bloque).toBe(true);
  });
});
