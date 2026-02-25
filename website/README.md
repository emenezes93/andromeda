# Site do projeto (GitHub Pages)

Landing page estática publicada via GitHub Actions.

## Publicar

1. No repositório: **Settings → Pages**
2. Em **Build and deployment**, em **Source** escolha **GitHub Actions**
3. A cada push em `main` o workflow `.github/workflows/pages.yml` faz o deploy da pasta `website/`

O site ficará em: `https://<seu-usuario>.github.io/<nome-do-repo>/`

## Links do GitHub

Se o repositório for outro, edite em `website/index.html` as URLs:
- `https://github.com/emenezes93/andromeda`
- `https://github.com/emenezes93/andromeda/issues`
- `https://github.com/emenezes93/andromeda/pulls`
