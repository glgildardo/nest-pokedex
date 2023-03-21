import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel( Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    
    try {
      const pokemon = await this.pokemonModel.create( createPokemonDto ); 
      return pokemon;
  
    } catch(error) {
      this.handleException(error); 
    }
  }

  findAll(paginationDto: PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;

    return this.pokemonModel.find()
    .limit(limit)
    .skip(offset)
    .sort({
      no: 1
    });
  }

  async findOne(id: string) {

    let pokemon: Pokemon;

    // No
    if ( !isNaN(+id)) {
      pokemon = await this.pokemonModel.findOne({no: id});
    }

    // MongoID
    if ( !pokemon && isValidObjectId(id)){
      pokemon = await this.pokemonModel.findById( id );
    }

    // Name
    if ( !pokemon ) {
      pokemon = await this.pokemonModel.findOne({ name: id.toLocaleLowerCase().trim()});
    }

    if (!pokemon) 
      throw new NotFoundException(`Pokemon with id, name of no "${id}" not found`);
    

    return pokemon;
  }

  async update(id: string, updatePokemonDto: UpdatePokemonDto) {
    
    const pokemon = await this.findOne( id );

    if ( updatePokemonDto.name ) {
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
    }

    try {
      await pokemon.updateOne(updatePokemonDto, {new: true});
      return {...pokemon.toJSON(), ...UpdatePokemonDto};
    } catch(error) {
      this.handleException(error);
    }


  }

  async remove(id: string) {
    const { deletedCount } = await this.pokemonModel.deleteOne( { _id: id} );

    if (deletedCount === 0) {
      throw new BadRequestException(`Pokemon with id "${ id }" not found`);
    }

    return;
  }

  private handleException(error: any) {
    if (error.code === 11000){
      throw new BadRequestException(`Pokemon exists in db ${ JSON.stringify( error.keyValue)}`);
    }

    console.log(error);
    throw new InternalServerErrorException(`Can't create pokemon - Check server logs`);
  
  }
}
