import { expect, test } from '@playwright/test';

// PORT_API de playwright.config.ts — doit rester synchronisé.
const API = 'http://localhost:5050/api';

const COMPTE = {
  nom: 'Auteur E2E',
  email: 'auteur@e2e.local',
  motDePasse: 'motdepasse123',
};

// L'inscription peut renvoyer 409 si un test précédent a déjà créé le compte :
// on ignore le code de retour, seule la connexion via l'UI compte.
test.beforeEach(async ({ request }) => {
  await request.post(`${API}/auth/register`, {
    data: COMPTE,
  });
});

test.describe('Publication et consultation d’annonces', () => {
  test('publie une annonce et la voit apparaître', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Email').fill(COMPTE.email);
    await page.getByLabel('Mot de passe').fill(COMPTE.motDePasse);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText('Publier une annonce')).toBeVisible();

    const dans2Jours = (heures: number): string => {
      const d = new Date(Date.now() + heures * 3_600_000);
      const pad = (n: number): string => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    await page.getByLabel('Titre').fill('Repas du club');
    await page.getByLabel('Date et heure').fill(dans2Jours(48));
    await page.getByLabel('Lieu').fill('Cour du lycée');
    await page.getByLabel('Description').fill('Grand repas de fin de semestre');
    await page.getByRole('button', { name: 'Publier' }).click();

    await expect(page.getByText('Repas du club')).toBeVisible();
    await expect(page.getByText('Cour du lycée')).toBeVisible();
    await expect(page.getByText(/annonce publiée/u)).toBeVisible();
  });

  test('l’auteur peut supprimer sa propre annonce', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Email').fill(COMPTE.email);
    await page.getByLabel('Mot de passe').fill(COMPTE.motDePasse);
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await page.getByLabel('Titre').fill('Atelier éphémère');
    await page.getByLabel('Date et heure').fill('2026-12-01T18:30');
    await page.getByLabel('Lieu').fill('Salle info');
    await page.getByLabel('Description').fill('Atelier de découverte');
    await page.getByRole('button', { name: 'Publier' }).click();
    await expect(page.getByText('Atelier éphémère')).toBeVisible();

    page.on('dialog', (dialog) => void dialog.accept());
    const article = page.locator('article', { hasText: 'Atelier éphémère' });
    await article.getByRole('button', { name: 'Supprimer' }).click();

    await expect(page.getByText('Atelier éphémère')).toBeHidden();
  });
});
