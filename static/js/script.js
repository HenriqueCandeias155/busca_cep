document.addEventListener('DOMContentLoaded', () => {

    const cepInput = document.getElementById('cep_input')
    const searchBtn = document.getElementById('search-btn')
    const btnText = searchBtn.querySelector('span')
    const loader = document.getElementById('loader')
    const resultContainer = document.getElementById('result-container')
    const erroMsg = document.getElementById('erro-message')

    // elementos do resultado
    const resCep = document.getElementById('res-cep')
    const resStreet = document.getElementById('res-street')
    const resNeighborhood = document.getElementById('res-neighborhood')
    const resCity = document.getElementById('res-city')
    const resState = document.getElementById('res-state')
    const resComplement = document.getElementById('res-complement')
    const resIbge = document.getElementById('res-ibge')
    const sourceBadge = document.getElementById('source-badge')

    // máscara CEP
    cepInput.addEventListener('input', (e) => {
        let valor = e.target.value.replace(/\D/g, '')

        if (valor.length > 5) {
            valor = valor.slice(0, 5) + '-' + valor.slice(5, 8)
        }

        e.target.value = valor
    })

    const searchCep = async () => {
        const cep = cepInput.value.replace(/\D/g, '')

        if (cep.length !== 8) {
            showErro('Por favor, informe um CEP válido')
            return
        }

        setLoading(true)
        hideErro()
        resultContainer.classList.add('hidden')

        try {
            const response = await fetch(`/api/consulta/${cep}`)
            const result = await response.json()

            if (response.ok) {
                displayResult(result)
            } else {
                showErro(result.erro || 'Erro ao buscar CEP')
            }

        } catch (error) {
            showErro('Erro de conexão com o servidor')
            console.error(error)

        } finally {
            setLoading(false)
        }
    }

    const displayResult = (result) => {
        const data = result.data
        const source = result.source

        resCep.textContent = data.cep.replace(/(\d{5})(\d{3})/, '$1-$2')
        resStreet.textContent = data.rua || 'Não informado'
        resNeighborhood.textContent = data.bairro || 'Não informado'
        resCity.textContent = data.cidade || 'Não informado'
        resState.textContent = data.estado || 'Não informado'
        resComplement.textContent = data.complemento || 'Não informado'
        resIbge.textContent = data.ibge || 'N/A'

        sourceBadge.textContent = source === 'local_db' ? 'BANCO LOCAL' : 'API EXTERNA'
        sourceBadge.className = 'badge ' + (source === 'local_db' ? 'badge_db' : 'badge_api')

        resultContainer.classList.remove('hidden')
    }

    const setLoading = (isLoading) => {
        if (isLoading) {
            btnText.classList.add('hidden')
            loader.style.display = 'block'
            searchBtn.disabled = true
        } else {
            btnText.classList.remove('hidden')
            loader.style.display = 'none'
            searchBtn.disabled = false
        }
    }

    const showErro = (mensagem) => {
        erroMsg.textContent = mensagem
        erroMsg.classList.remove('hidden')
    }

    const hideErro = () => {
        erroMsg.classList.add('hidden')
    }

    searchBtn.addEventListener('click', searchCep)

    cepInput.addEventListener('keypress', (ev) => {
        if (ev.key === 'Enter') {
            searchCep()
        }
    })

})