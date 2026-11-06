import { expect, test } from '@playwright/test';

test.describe('Tableau pour visiteur', () => {
  test('affiche le bulletin et propose l’inscription', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Annonces du club' })).toBeVisible();
    // La base peut être vide ou contenir des annonces des tests précédents :
    // le compteur sous le titre est toujours présent.
    await expect(page.getByText(/annonce(s)? publiée(s)?|Aucune annonce/u)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
    await expect(page.getByText('Lecture seule')).toBeVisible();
  });
});
