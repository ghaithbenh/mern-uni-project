import { expect, test } from '@playwright/test';

// PORT_API de playwright.config.ts — doit rester synchronisé.
const API = 'http://localhost:5050/api';

const COMPTE = {
  nom: 'Admin E2E',
  email: 'patron@e2e.local', // correspond à ADMIN_EMAILS dans e2e/api-boot.ts
  motDePasse: 'motdepasse123',
};

test.describe('Administration', () => {
  test('un email ADMIN_EMAILS devient admin et accède au tableau de bord', async ({
    page,
  }) => {
    await page.goto('/');

    await page.request.post(`${API}/auth/register`, {
      data: COMPTE,
    });

    await page.getByLabel('Email').fill(COMPTE.email);
    await page.getByLabel('Mot de passe').fill(COMPTE.motDePasse);
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // L'onglet administration est réservé aux admins
    await expect(page.getByText('Administration', { exact: true })).toBeVisible();
  });

  test('le tableau de bord rend les KPI et les graphiques', async ({ page }) => {
    await page.goto('/');

    await page.request.post(`${API}/auth/register`, {
      data: COMPTE,
    });

    // Session via l'UI
    await page.getByLabel('Email').fill(COMPTE.email);
    await page.getByLabel('Mot de passe').fill(COMPTE.motDePasse);
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await page.getByRole('button', { name: 'Administration' }).click();

    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
    await expect(page.getByText('Utilisateurs', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Rôles').or(page.getByText('Distribution des avis'))).toBeVisible();
    await expect(page.locator('svg').first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
  });
});
