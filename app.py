import psycopg2
import requests
from flask import Flask, render_template, jsonify
from psycopg2.extras import RealDictCursor

from database import get_connection

app = Flask(__name__)

INVERTEXTO_TOKEN= '25223|Yi4bUpVrRL7I9mVHj8uoohHMc6qHE3yZ'
BASE_URL = 'https://api.invertexto.com/v1/cep/'

@app.route('/ping')
def ping():
    return 'Projeto Busca CEP'

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/consulta/<cep_input>')
def consulta_cep(cep_input):

    #13411-086
    cep_formatado = ''.join(filter(str.isdigit, cep_input))


    #Verifica a quantidade dde digitos do CEP
    if len(cep_formatado) != 8:
        return jsonify({"error": "CEP invalido!! Deve conter 8 digitos"}), 400

    #verifica se a conexão com o banco de dados
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Erro de conexão com o banco de dados!"}), 500

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        params = [cep_formatado]
        sql = "SELECT * FROM ceps where cep =  %s"
        cursor.execute(sql, params)
        cep_bd_local = cursor.fetchone()
        if cep_bd_local:
            cursor.close()
            conn.close()
            dados = {
                "source": "local_db",
                "data": cep_bd_local
            }
            return jsonify(dados)

        #se não existir no BD, consulta a API externa
        response = requests.get(f'{BASE_URL}{cep_formatado}?token={INVERTEXTO_TOKEN}')

        #se a API retornou Ok, salva os dados no banco
        if response.status_code == 200:
            dados = response.json()
            sql =  "INSERT INTO ceps (cep, estado, cidade, bairro, rua, complemento, ibge) VALUES (%s, %s, %s, %s, %s, %s, %s)"
            params = [cep_formatado, dados.get('state'), dados .get('city'), dados.get('neighborhood'), dados.get('street'), dados.get('complement'), dados.get('ibgew') ]


            cursor.execute(sql, params)

            conn.commit()
            cursor.close()
            conn.close()

            dados_resposta = {
                "source": "api_externa",
                "data": {
                    "cep": cep_formatado,
                    "estado": dados.get('state'),
                    "cidade": dados.get('city'),
                    "bairro": dados.get('neighborhood'),
                    "rua": dados.get('street'),
                    "complemento": dados.get('complement'),
                    "ibge": dados.get('ibge')
                }}

            return jsonify(dados_resposta)

        elif response.status_code == 400:
            cursor.close()
            conn.close()
            return jsonify({"error": "CEP não encontrado na API!"}), 404

        else :
            cursor.close()
            conn.close()
            return jsonify({"error": "Erro ao consultar API externa"}), response.status_code

    except Exception as ex:
        print('erro-----', ex)

        if conn:
            conn.close()
        return jsonify({"error": "Erro interno no servidor"}), 500

if __name__ == '__main__':
    app.run(debug=True)