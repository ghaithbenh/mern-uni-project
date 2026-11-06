import { expect, test } from '@playwright/test';

const COMPTE = {
  nom: 'Ghaith E2E',
  email: 'gahith@e2e.local',
  motDePasse: 'motdepasse123',
};

test.describe('Cycle d’authentification', () => {
  test('inscription → session → déconnexion → connexion', async ({ page }) => {
    await page.goto('/');

    // Inscription
    await page.getByText('Pas de compte ? Inscris-toi').click();
    await page.getByLabel('Nom').fill(COMPTE.nom);
    await page.getByLabel('Email').fill(COMPTE.email);
    await page.getByLabel('Mot de passe').fill(COMPTE.motDePasse);
    await page.getByRole('button', { name: 'S’inscrire' }).click();

    await expect(page.getByText(COMPTE.nom, { exact: false }).first()).toBeVisible();
    await expect(page.getByText('membre', { exact: true })).toBeVisible();

    // Le formulaire d'ajout remplace le formulaire d'auth
    await expect(page.getByText('Publier une annonce')).toBeVisible();

    // Déconnexion
    await page.getByRole('button', { name: 'Déconnexion' }).click();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();

    // Connexion
    await page.getByLabel('Email').fill(COMPTE.email);
    await page.getByLabel('Mot de passe').fill(COMPTE.motDePasse);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText('Publier une annonce')).toBeVisible();
  });

  test('refuse un mauvais mot de passe avec le message générique', async ({ page }) => {
    await page.goto('/');

    // On crée le compte par API pour rester rapide, puis on tente un login raté.
    await page.request.post('http://localhost:5050/api/auth/register', {
      data: COMPTE,
    });

    await page.getByLabel('Email').fill(COMPTE.email);
    await page.getByLabel('Mot de passe').fill('fauxmotdepasse');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(
      page.getByText('Email ou mot de passe incorrect')
    ).toBeVisible();
  });
});
